/**
 * Feishu (飞书) channel implementation
 */

import express from 'express';
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
    token: string;
    app_id: string;
    tenant_key: string;
  };
  event: {
    sender?: {
      sender_id: { open_id: string };
      sender_name: string;
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
  };
}

export class FeishuChannel extends BaseChannel {
  readonly type = 'feishu';
  private app: express.Application | null = null;
  private server: http.Server | null = null;
  private appId: string = '';
  private appSecret: string = '';
  private verificationToken: string = '';
  private webhookPath: string = '/webhook/feishu';
  private accessToken: string = '';
  private accessTokenExpiry: number = 0;

  constructor() {
    super();
  }

  async initialize(config: ChannelConfig): Promise<void> {
    await super.initialize(config);
    
    if (!this.config) return;

    this.appId = process.env.FEISHU_APP_ID ?? '';
    this.appSecret = process.env.FEISHU_APP_SECRET ?? '';
    this.verificationToken = process.env.FEISHU_VERIFICATION_TOKEN ?? '';
    this.webhookPath = this.config.webhookPath ?? '/webhook/feishu';

    if (!this.appId || !this.appSecret) {
      logger.warn('Feishu credentials not configured. Set FEISHU_APP_ID and FEISHU_APP_SECRET');
    }

    logger.info(`Feishu channel initialized (webhook: ${this.webhookPath})`);
  }

  async start(): Promise<void> {
    if (!this.config?.enabled) {
      logger.info('Feishu channel is disabled');
      return;
    }

    this.app = express();
    this.app.use(express.json());

    this.app.post(this.webhookPath, this.handleWebhook.bind(this));
    this.app.get(this.webhookPath, this.handleVerification.bind(this));

    this.server = this.app.listen(0, () => {
      const addr = this.server?.address();
      logger.info(`Feishu webhook server started on port ${typeof addr === 'object' ? addr?.port : 'unknown'}`);
    });
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

    try {
      const response = await fetch(`https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          receive_id: message.recipientId,
          msg_type: 'text',
          content: JSON.stringify({ text: message.content }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Feishu API error: ${response.status} - ${error}`);
      }

      logger.debug(`Feishu message sent to ${message.recipientId}`);
    } catch (error) {
      logger.error(`Failed to send Feishu message: ${error}`);
      throw error;
    }
  }

  private async handleWebhook(req: express.Request, res: express.Response): Promise<void> {
    if (req.body?.type === 'url_verification') {
      res.json({ challenge: req.body.challenge });
      return;
    }

    const event = req.body as FeishuEvent;

    if (!this.verifySignature(req)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    res.json({ received: true });

    if (event.event?.message) {
      const feishuMessage = event.event.message;
      
      if (feishuMessage.chat_type === 'group') {
        logger.debug('Skipping group message');
        return;
      }

      let content = '';
      try {
        const parsed = JSON.parse(feishuMessage.content);
        content = parsed.text ?? '';
      } catch {
        content = feishuMessage.content;
      }

      const inbound: InboundMessage = {
        channel: this.type,
        senderId: event.event.sender?.sender_id?.open_id ?? 'unknown',
        senderName: event.event.sender?.sender_name,
        content,
        timestamp: Date.now(),
        metadata: {
          messageId: feishuMessage.message_id,
          chatId: feishuMessage.chat_id,
          chatType: feishuMessage.chat_type,
        },
      };

      this.emit('message', inbound);
    }
  }

  private handleVerification(req: express.Request, res: express.Response): void {
    const challenge = req.query.challenge as string;
    if (challenge) {
      res.json({ challenge });
      return;
    }
    res.json({ status: 'ok' });
  }

  private verifySignature(req: express.Request): boolean {
    const timestamp = req.headers['x-lark-timestamp'] as string;
    const signature = req.headers['x-lark-signature'] as string;

    if (!timestamp || !signature) return false;

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    const payload = timestamp + this.verificationToken;
    const expected = crypto
      .createHmac('sha256', payload)
      .update(JSON.stringify(req.body))
      .digest('hex');

    return signature === expected;
  }

  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.accessTokenExpiry) return;

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
  }
}
