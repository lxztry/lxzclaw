/**
 * Telegram Channel - Telegram Bot 集成
 */

import express, { Request, Response } from 'express';
import http from 'http';
import { logger } from '../utils/logger.js';

export interface TelegramConfig {
  botToken: string;
  allowedUsers?: string[];
  port?: number;
}

interface TelegramUpdate {
  message?: {
    from: {
      id: number;
      username?: string;
      first_name?: string;
    };
    chat: {
      id: number;
    };
    text: string;
  };
  callback_query?: {
    from: {
      id: number;
      username?: string;
    };
    data: string;
  };
}

export class TelegramChannel {
  private config: TelegramConfig;
  private botToken: string;
  private server?: http.Server;
  private messageHandler?: (userId: string, userName: string, content: string) => Promise<string | null>;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.botToken = config.botToken;
  }

  setMessageHandler(handler: (userId: string, userName: string, content: string) => Promise<string | null>): void {
    this.messageHandler = handler;
  }

  async start(): Promise<void> {
    const app = express();
    app.use(express.json());

    app.post('/webhook', async (req: Request, res: Response) => {
      const update = req.body as TelegramUpdate;

      // Handle message
      if (update.message && this.messageHandler) {
        const msg = update.message;
        const userId = String(msg.from.id);
        const userName = msg.from.username ?? msg.from.first_name ?? 'User';
        
        // Check allowed users
        if (this.config.allowedUsers && !this.config.allowedUsers.includes(userId)) {
          res.status(200).json({});
          return;
        }

        const response = await this.messageHandler(userId, userName, msg.text);

        if (response) {
          await this.sendMessage(msg.chat.id, response);
        }
      }

      // Handle callback query (button clicks)
      if (update.callback_query && this.messageHandler) {
        const query = update.callback_query;
        await this.messageHandler(String(query.from.id), query.from.username ?? 'User', query.data);
      }

      res.status(200).json({});
    });

    // Set webhook
    try {
      const webhookUrl = `https://your-domain.com/telegram/webhook`;
      await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
    } catch (e) {
      logger.warn(`Failed to set Telegram webhook: ${e}`);
    }

    const port = this.config.port ?? 18791;
    this.server = app.listen(port, () => {
      logger.info(`Telegram channel listening on port ${port}`);
    });
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });
    } catch (error) {
      logger.error(`Failed to send Telegram message: ${error}`);
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }
}