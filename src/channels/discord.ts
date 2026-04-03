/**
 * Discord Channel - Discord Bot 集成
 */

import express, { Request, Response } from 'express';
import http from 'http';
import { logger } from '../utils/logger.js';

export interface DiscordConfig {
  botToken: string;
  applicationId: string;
  guildId?: string;
  channelIds?: string[];
  port?: number;
}

export class DiscordChannel {
  private config: DiscordConfig;
  private botToken: string;
  private server?: http.Server;
  private messageHandler?: (userId: string, userName: string, content: string) => Promise<string | null>;

  constructor(config: DiscordConfig) {
    this.config = config;
    this.botToken = config.botToken;
  }

  setMessageHandler(handler: (userId: string, userName: string, content: string) => Promise<string | null>): void {
    this.messageHandler = handler;
  }

  async start(): Promise<void> {
    const app = express();
    app.use(express.json());

    app.post('/interactions', async (req: Request, res: Response) => {
      const { type, data } = req.body;

      if (type === 1) {
        res.json({ type: 1 });
        return;
      }

      if (type === 2 && this.messageHandler) {
        const commandName = data.name;
        const response = await this.messageHandler('command', `user`, `/${commandName}`);

        res.json({
          type: 4,
          data: { content: response ?? `Command /${commandName} received` },
        });
      }
    });

    app.post('/events', async (req: Request, res: Response) => {
      const { t, d } = req.body;

      if (t === 'MESSAGE_CREATE' && this.messageHandler) {
        const msg = d as any;
        
        if (msg.author?.bot) {
          res.status(200).json({});
          return;
        }

        const response = await this.messageHandler(msg.author.id, msg.author.username, msg.content);

        if (response) {
          await this.sendMessage(msg.channel_id, response);
        }
      }

      res.status(200).json({});
    });

    const port = this.config.port ?? 18790;
    this.server = app.listen(port, () => {
      logger.info(`Discord channel listening on port ${port}`);
    });
  }

  async sendMessage(channelId: string, content: string): Promise<void> {
    try {
      await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      logger.error(`Failed to send Discord message: ${error}`);
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }
}