/**
 * Feishu (飞书) channel implementation - Enhanced
 * 
 * Features:
 * - Event subscription (im.message.receive_v1)
 * - Message reply support
 * - Signature verification (encrypt mode)
 * - Group chat support (configurable)
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import http from 'http';
import { BaseChannel, ChannelConfig, InboundMessage, OutboundMessage } from './base.js';
import { logger } from '../utils/logger.js';

interface FeishuEvent {
  schema: string;
  header: {
    event_id: string;
    event_type: string;
    create_time: string;
    token?: string;
    app_id: string;
    tenant_key: string;
  };
  event: {
    sender?: {
      sender_id: { open_id: string; union_id?: string; user_id?: string };
      sender_name: string;
      sender_type?: string;
    };
    message?: {
      message_id: string;
      root_id?: string;
      parent_id?: string;
      create_time: string;
      chat_id: string;
      chat_type: 'p2p' | 'group';
      message_type: string;
      content: string;
    };
    update_message?: {
      message_id: string;
      update_content: string;
    };
  };
}

export interface FeishuConfig extends ChannelConfig {
  encrypt?: boolean;
  encryptKey?: string;
  allowGroupMessages?: boolean;
  groupKeywords?: string[];  // Keywords to trigger in groups
}

export class FeishuChannel extends BaseChannel {
  readonly type = 'feishu';
  private app: express.Application | null = null;
  private server: http.Server | null = null;
  private appId: string = '';
  private appSecret: string = '';
  private verificationToken: string = '';
  private encryptKey: string = '';
  private webhookPath: string = '/webhook/feishu';
  private accessToken: string = '';
  private accessTokenExpiry: number = 0;
  private allowGroupMessages: boolean = false;
  private groupKeywords: string[] = [];
  private messageQueue: Map<string, (msg: InboundMessage) => void> = new Map();

  constructor() {
    super();
  }

  async initialize(config: FeishuConfig): Promise<void> {
    await super.initialize(config);
    
    if (!this.config) return;

    this.appId = process.env.FEISHU_APP_ID ?? '';
    this.appSecret = process.env.FEISHU_APP_SECRET ?? '';
    this.verificationToken = process.env.FEISHU_VERIFICATION_TOKEN ?? '';
    this.encryptKey = process.env.FEISHU_ENCRYPT_KEY ?? '';
    this.webhookPath = this.config.webhookPath ?? '/webhook/feishu';
    this.allowGroupMessages = config.allowGroupMessages ?? false;
    this.groupKeywords = config.groupKeywords ?? [];

    if (!this.appId || !this.appSecret) {
      logger.warn('Feishu credentials not configured. Set FEISHU_APP_ID and FEISHU_APP_SECRET');
    }

    logger.info(`Feishu channel initialized (webhook: ${this.webhookPath}, encrypt: ${!!this.encryptKey})`);
  }

  async start(): Promise<void> {
    if (!this.config?.enabled) {
      logger.info('Feishu channel is disabled');
      return;
    }

    this.app = express();
    this.app.use(express.json({ verify: this.rawBodyMiddleware.bind(this) }));

    // Event subscription endpoint
    this.app.post(this.webhookPath, this.handleWebhook.bind(this));
    
    // URL verification endpoint
    this.app.get(this.webhookPath, this.handleVerification.bind(this));

    this.server = this.app.listen(0, () => {
      const addr = this.server?.address();
      logger.info(`Feishu webhook server started on port ${typeof addr === 'object' ? addr?.port : 'unknown'}`);
    });
  }

  private rawBodyMiddleware(req: Request, _res: Response, buf: Buffer): void {
    (req as Request & { rawBody: Buffer }).rawBody = buf;
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Feishu webhook server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async send(message: OutboundMessage): Promise<void> {
    if (!message.recipientId) {
      logger.warn('Feishu send requires recipientId');
      return;
    }

    await this.ensureAccessToken();

    const msgType = message.metadata?.msgType as string ?? 'text';
    const msgContent = message.content;
    let payloadContent: string;

    if (msgType === 'text') {
      payloadContent = JSON.stringify({ text: msgContent });
    } else if (msgType === 'post') {
      payloadContent = JSON.stringify({ post: msgContent });
    } else {
      payloadContent = JSON.stringify({ text: msgContent });
    }

    try {
      const response = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          receive_id: message.recipientId,
          msg_type: msgType,
          content: payloadContent,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Feishu API error: ${response.status} - ${error}`);
      }

      const result = await response.json() as { code?: number; msg?: string };
      logger.debug(`Feishu message sent to ${message.recipientId}: ${result.code === 0 ? 'success' : result.msg}`);
    } catch (error) {
      logger.error(`Failed to send Feishu message: ${error}`);
      throw error;
    }
  }

  /**
   * Reply to a specific message in Feishu
   */
  async replyToMessage(recipientId: string, messageId: string, text: string): Promise<void> {
    await this.ensureAccessToken();

    try {
      const response = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          receive_id: recipientId,
          msg_type: 'text',
          content: JSON.stringify({ text }),
          reply_id: messageId,  // Reply to specific message
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Feishu reply error: ${response.status} - ${error}`);
      }

      logger.debug(`Feishu reply sent to message ${messageId}`);
    } catch (error) {
      logger.error(`Failed to reply to Feishu message: ${error}`);
      throw error;
    }
  }

  /**
   * Send a message and wait for reply (async iterator)
   */
  async *waitForReply(messageId: string, timeoutMs: number = 30000): AsyncGenerator<InboundMessage> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const resolver = this.messageQueue.get(messageId);
      if (resolver) {
        this.messageQueue.delete(messageId);
        yield resolver as unknown as InboundMessage;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async handleWebhook(req: Request, res: Response): Promise<void> {
    const body = req.body;
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    // URL verification challenge
    if (body.type === 'url_verification') {
      const challenge = body.challenge ?? req.query.challenge;
      logger.debug('Feishu URL verification challenge received');
      res.json({ challenge });
      return;
    }

    // Event encryption handling
    let event: FeishuEvent;
    if (body.encrypt) {
      try {
        const decrypted = this.decrypt(body.encrypt);
        event = JSON.parse(decrypted);
      } catch (error) {
        logger.error('Failed to decrypt Feishu event:', error);
        res.status(400).json({ error: 'Decryption failed' });
        return;
      }
    } else {
      event = body;
    }

    // Verify signature (for non-encrypted events)
    if (!body.encrypt && !this.verifySignature(rawBody ?? Buffer.from(JSON.stringify(body)), req.headers)) {
      logger.warn('Invalid Feishu signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Respond immediately to Feishu (they require fast response)
    res.json({ code: 0, msg: 'success' });

    // Process event asynchronously
    this.processEvent(event);
  }

  private processEvent(event: FeishuEvent): void {
    const eventType = event.header.event_type;

    logger.debug(`Feishu event: ${eventType}`);

    // Handle message events
    if (eventType === 'im.message.receive_v1' && event.event?.message) {
      this.handleMessageEvent(event);
      return;
    }

    // Handle message updates
    if (eventType === 'im.message.update_v1' && event.event?.update_message) {
      this.handleMessageUpdate(event);
      return;
    }

    logger.debug(`Unhandled Feishu event type: ${eventType}`);
  }

  private handleMessageEvent(event: FeishuEvent): void {
    const message = event.event!.message!;
    const sender = event.event!.sender!;

    // Skip group messages if not allowed
    if (message.chat_type === 'group' && !this.allowGroupMessages) {
      logger.debug('Skipping group message (not allowed)');
      return;
    }

    // For group messages, check keywords
    if (message.chat_type === 'group' && this.groupKeywords.length > 0) {
      let content = '';
      try {
        const parsed = JSON.parse(message.content);
        content = parsed.text ?? '';
      } catch {
        content = message.content;
      }

      const hasKeyword = this.groupKeywords.some(kw => content.includes(kw));
      if (!hasKeyword) {
        logger.debug('Skipping group message (no keyword match)');
        return;
      }
    }

    // Parse message content
    let text = '';
    try {
      const parsed = JSON.parse(message.content);
      text = parsed.text ?? parsed.content ?? message.content;
    } catch {
      text = message.content;
    }

    // Create inbound message
    const inbound: InboundMessage = {
      channel: this.type,
      senderId: sender.sender_id?.open_id ?? sender.sender_id?.union_id ?? sender.sender_id?.user_id ?? 'unknown',
      senderName: sender.sender_name,
      content: text,
      timestamp: parseInt(message.create_time) * 1000,
      metadata: {
        messageId: message.message_id,
        rootId: message.root_id,
        parentId: message.parent_id,
        chatId: message.chat_id,
        chatType: message.chat_type,
        messageType: message.message_type,
        tenantKey: event.header.tenant_key,
      },
    };

    // Check if waiting for reply
    const resolver = this.messageQueue.get(message.message_id);
    if (resolver) {
      this.messageQueue.delete(message.message_id);
      resolver(inbound);
      return;
    }

    this.emit('message', inbound);
  }

  private handleMessageUpdate(event: FeishuEvent): void {
    const update = event.event!.update_message!;
    
    this.emit('message_update', {
      messageId: update.message_id,
      updateContent: update.update_content,
      channel: this.type,
    });
  }

  private handleVerification(req: Request, res: Response): void {
    const challenge = req.query.challenge as string;
    if (challenge) {
      logger.debug('Feishu URL verification');
      res.json({ challenge });
      return;
    }
    res.json({ status: 'ok' });
  }

  private verifySignature(body: Buffer, headers: Record<string, unknown | string | string[] | undefined>): boolean {
    const timestamp = headers['x-lark-timestamp'] as string;
    const signature = headers['x-lark-signature'] as string;

    if (!timestamp || !signature) {
      return false;
    }

    // Check timestamp (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      logger.warn('Feishu signature timestamp out of range');
      return false;
    }

    // Compute expected signature
    const payload = timestamp + this.verificationToken;
    const expected = crypto
      .createHmac('sha256', payload)
      .update(body)
      .digest('hex');

    return signature === expected;
  }

  private decrypt(encrypted: string): string {
    const key = crypto.createHash('sha256').update(this.encryptKey).digest();
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.accessTokenExpiry) {
      return;
    }

    try {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get Feishu access token: ${response.status}`);
      }

      const data = await response.json() as { tenant_access_token: string; expire: number };
      this.accessToken = data.tenant_access_token;
      this.accessTokenExpiry = Date.now() + (data.expire - 60) * 1000;
      
      logger.debug('Feishu access token refreshed');
    } catch (error) {
      logger.error(`Feishu auth error: ${error}`);
      throw error;
    }
  }
}
