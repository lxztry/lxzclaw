/**
 * Session manager - creates, manages, and tracks sessions
 */

import { randomUUID } from 'crypto';
import { Session, Message, ToolCall, SessionOptions } from './types.js';
import { SessionStore } from './store.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import os from 'os';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private store: SessionStore;
  private maxHistory: number;

  constructor(options: { 
    basePath?: string;
    maxHistory?: number;
  } = {}) {
    const basePath = options.basePath ?? path.join(os.homedir(), '.lxzclaw', 'sessions');
    this.store = new SessionStore(basePath);
    this.maxHistory = options.maxHistory ?? 100;
  }

  async init(): Promise<void> {
    await this.store.init();
    logger.info('Session manager initialized');
  }

  create(options: SessionOptions = {}): Session {
    const id = options.id ?? randomUUID();
    const now = Date.now();

    const session: Session = {
      id,
      type: options.type ?? 'chat',
      workspace: options.workspace,
      createdAt: now,
      updatedAt: now,
      messages: [],
      toolCalls: [],
      context: {},
      metadata: {
        userId: options.userId,
        channelId: options.channelId,
        model: options.model,
      },
    };

    this.sessions.set(id, session);
    logger.debug(`Session created: ${id} (${session.type})`);

    return session;
  }

  async get(id: string): Promise<Session | null> {
    // Check memory first
    if (this.sessions.has(id)) {
      return this.sessions.get(id)!;
    }

    // Try loading from store
    const session = await this.store.load(id);
    if (session) {
      this.sessions.set(id, session);
      return session;
    }

    return null;
  }

  async save(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) {
      logger.warn(`Cannot save non-existent session: ${id}`);
      return;
    }

    session.updatedAt = Date.now();
    await this.store.save(session);
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
    await this.store.delete(id);
    logger.debug(`Session deleted: ${id}`);
  }

  addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`Cannot add message to non-existent session: ${sessionId}`);
      return null;
    }

    const fullMessage: Message = {
      ...message,
      id: randomUUID(),
      timestamp: Date.now(),
    };

    session.messages.push(fullMessage);

    // Trim history if needed
    if (session.messages.length > this.maxHistory) {
      const removeCount = session.messages.length - this.maxHistory;
      session.messages.splice(0, removeCount);
    }

    session.updatedAt = Date.now();
    return fullMessage;
  }

  addToolCall(sessionId: string, toolCall: Omit<ToolCall, 'id' | 'startTime'>): ToolCall | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const fullToolCall: ToolCall = {
      ...toolCall,
      id: randomUUID(),
      startTime: Date.now(),
    };

    session.toolCalls.push(fullToolCall);
    return fullToolCall;
  }

  updateToolCall(sessionId: string, toolCallId: string, update: Partial<ToolCall>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const toolCall = session.toolCalls.find(tc => tc.id === toolCallId);
    if (!toolCall) return false;

    if (update.output !== undefined) toolCall.output = update.output;
    if (update.error !== undefined) toolCall.error = update.error;
    if (update.endTime !== undefined) toolCall.endTime = update.endTime;

    return true;
  }

  getHistory(sessionId: string, limit?: number): Message[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    if (limit !== undefined) {
      return session.messages.slice(-limit);
    }
    return [...session.messages];
  }

  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  async cleanupIdle(maxAgeMs: number): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      if (now - session.updatedAt > maxAgeMs) {
        await this.save(id);
        this.sessions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} idle sessions`);
    }

    return cleaned;
  }

  async shutdown(): Promise<void> {
    // Save all sessions
    const savePromises = Array.from(this.sessions.keys()).map(id => this.save(id));
    await Promise.all(savePromises);
    logger.info('Session manager shutdown complete');
  }
}
