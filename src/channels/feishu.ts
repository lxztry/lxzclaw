/**
 * Feishu (飞书) channel implementation
 *
 * Features:
 * - WebSocket long connection mode (no public URL needed!)
 * - Webhook mode (requires public HTTPS URL)
 * - Event subscription (im.message.receive_v1)
 * - Message reply support
 * - Group chat support (configurable)
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import http from 'http';
import * as lark from '@larksuiteoapi/node-sdk';
import { BaseChannel, ChannelConfig, InboundMessage, OutboundMessage } from './base.js';
import { logger } from '../utils/logger.js';

export interface FeishuConfig extends ChannelConfig {
  connectionMode?: 'websocket' | 'webhook';
  encrypt?: boolean;
  encryptKey?: string;
  allowGroupMessages?: boolean;
  groupKeywords?: string[];
  webhookPath?: string;
  sharedApp?: express.Application;
  sharedServer?: http.Server;
}

export class FeishuChannel extends BaseChannel {
  readonly type = 'feishu';
  private app: express.Application | null = null;
  private server: http.Server | null = null;
  private sharedApp: express.Application | null = null;
  private sharedServer: http.Server | null = null;
  private wsClient: lark.WSClient | null = null;
  private appId: string = '';
  private appSecret: string = '';
  private verificationToken: string = '';
  private encryptKey: string = '';
  private webhookPath: string = '/webhook/feishu';
  private connectionMode: 'websocket' | 'webhook' = 'websocket';
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
    this.connectionMode = config.connectionMode ?? 'websocket';
    this.webhookPath = config.webhookPath ?? '/webhook/feishu';
    this.allowGroupMessages = config.allowGroupMessages ?? false;
    this.groupKeywords = config.groupKeywords ?? [];
    this.sharedApp = config.sharedApp ?? null;
    this.sharedServer = config.sharedServer ?? null;

    if (!this.appId || !this.appSecret) {
      logger.warn('Feishu credentials not configured. Set FEISHU_APP_ID and FEISHU_APP_SECRET');
    }

    logger.info(`Feishu channel initialized (mode: ${this.connectionMode}, webhook: ${this.webhookPath})`);
  }

  async start(): Promise<void> {
    if (!this.config?.enabled) {
      logger.info('Feishu channel is disabled');
      return;
    }

    if (this.connectionMode === 'websocket') {
      await this.startWebSocketMode();
    } else {
      await this.startWebhookMode();
    }
  }

  private async startWebSocketMode(): Promise<void> {
    logger.info('Feishu WebSocket mode: connecting to Feishu servers...');

    const baseConfig = {
      appId: this.appId,
      appSecret: this.appSecret,
    };

    const client = new lark.WSClient({
      ...baseConfig,
      loggerLevel: lark.LoggerLevel.info,
    });

    this.wsClient = client;

    client.start({
      eventDispatcher: new lark.EventDispatcher({}).register({
        'im.message.receive_v1': async (data: any) => {
          await this.handleMessage(data);
        },
      }),
    });

    logger.info('Feishu WebSocket connected successfully (no public URL needed!)');
  }

  private async handleMessage(data: any): Promise<void> {
    const { message, sender } = data;

    if (!message) {
      logger.debug('No message in data, skipping');
      return;
    }

    const messageContent = message.content ? JSON.parse(message.content) : {};
    const text = messageContent.text ?? messageContent.content ?? JSON.stringify(messageContent);

    // Skip group messages if not allowed
    if (message.chat_type === 'group' && !this.allowGroupMessages) {
      logger.debug('Skipping group message (not allowed)');
      return;
    }

    // For group messages, check keywords
    if (message.chat_type === 'group' && this.groupKeywords.length > 0) {
      const hasKeyword = this.groupKeywords.some(kw => text.includes(kw));
      if (!hasKeyword) {
        logger.debug('Skipping group message (no keyword match)');
        return;
      }
    }

    const senderId = sender?.sender_id?.open_id ?? sender?.sender_id?.user_id ?? 'unknown';
    const senderName = sender?.sender_name ?? 'Unknown';

    const inbound: InboundMessage = {
      channel: this.type,
      senderId,
      senderName,
      content: text,
      timestamp: message.create_time ? parseInt(message.create_time) * 1000 : Date.now(),
      metadata: {
        messageId: message.message_id,
        rootId: message.root_id,
        parentId: message.parent_id,
        chatId: message.chat_id,
        chatType: message.chat_type,
        messageType: message.message_type,
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

  private async startWebhookMode(): Promise<void> {
    if (this.sharedApp) {
      this.app = this.sharedApp;
    } else {
      this.app = express();
    }

    this.app.use(express.json({ verify: this.rawBodyMiddleware.bind(this) }));

    // Event subscription endpoint
    this.app.post(this.webhookPath, this.handleWebhook.bind(this));

    // URL verification endpoint
    this.app.get(this.webhookPath, this.handleVerification.bind(this));

    // Only create own server if not using shared server
    if (!this.sharedServer) {
      this.server = this.app.listen(0, () => {
        const addr = this.server?.address();
        logger.info(`Feishu webhook server started on port ${typeof addr === 'object' ? addr?.port : 'unknown'}`);
      });
    } else {
      logger.info(`Feishu webhook using shared server at ${this.webhookPath}`);
    }
  }

  private rawBodyMiddleware(req: Request, _res: Response, buf: Buffer): void {
    (req as Request & { rawBody: Buffer }).rawBody = buf;
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wsClient) {
        // WebSocket client doesn't have a stop method, just null it
        this.wsClient = null;
        logger.info('Feishu WebSocket disconnected');
      }
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
    let payloadContent: string;

    if (msgType === 'text') {
      payloadContent = JSON.stringify({ text: message.content });
    } else if (msgType === 'post') {
      payloadContent = JSON.stringify({ post: message.content });
    } else {
      payloadContent = JSON.stringify({ text: message.content });
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
          reply_id: messageId,
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
    let event: any;
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
    if (!body.encrypt && this.verificationToken) {
      if (!this.verifySignature(rawBody ?? Buffer.from(JSON.stringify(body)), req.headers)) {
        logger.warn('Invalid Feishu signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    // Respond immediately to Feishu
    res.json({ code: 0, msg: 'success' });

    // Process event asynchronously
    if (event.header?.event_type === 'im.message.receive_v1') {
      await this.handleMessage(event.event);
    }
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

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      logger.warn('Feishu signature timestamp out of range');
      return false;
    }

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
