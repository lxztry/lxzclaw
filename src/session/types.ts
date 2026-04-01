/**
 * Session types and interfaces
 */

export type SessionType = 'cli' | 'chat' | 'task';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface Session {
  id: string;
  type: SessionType;
  workspace?: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  toolCalls: ToolCall[];
  context: Record<string, unknown>;
  metadata: {
    userId?: string;
    channelId?: string;
    model?: string;
  };
}

export interface SessionOptions {
  id?: string;
  type?: SessionType;
  workspace?: string;
  userId?: string;
  channelId?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}
