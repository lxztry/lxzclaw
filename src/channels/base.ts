/**
 * Base channel interface
 */

import { EventEmitter } from 'events';

export interface ChannelConfig {
  type: string;
  enabled: boolean;
  webhookPath?: string;
  authToken?: string;
}

export interface InboundMessage {
  channel: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface OutboundMessage {
  content: string;
  recipientId?: string;
  metadata?: Record<string, unknown>;
}

export interface Channel extends EventEmitter {
  readonly type: string;
  readonly enabled: boolean;

  initialize(config: ChannelConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  send(message: OutboundMessage): Promise<void>;
}

export abstract class BaseChannel extends EventEmitter implements Channel {
  abstract readonly type: string;
  readonly enabled: boolean = true;
  protected config: ChannelConfig | null = null;

  async initialize(config: ChannelConfig): Promise<void> {
    this.config = config;
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract send(message: OutboundMessage): Promise<void>;

  protected createInboundMessage(data: unknown): InboundMessage {
    return {
      channel: this.type,
      senderId: 'unknown',
      content: String(data),
      timestamp: Date.now(),
    };
  }
}
