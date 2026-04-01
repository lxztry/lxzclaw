/**
 * Gateway types
 */

export interface GatewayConfig {
  port: number;
  host: string;
  authToken?: string;
  corsOrigins: string[];
}

export interface WSMessage {
  type: string;
  id?: string;
  payload?: unknown;
}

export interface ChatPayload {
  message: string;
  sessionId?: string;
  stream?: boolean;
}

export interface ResponsePayload {
  type: 'text' | 'tool_call' | 'tool_result' | 'error';
  content: string;
  sessionId: string;
  messageId?: string;
}

export interface SessionInfo {
  id: string;
  type: 'cli' | 'chat' | 'task';
  createdAt: number;
  messageCount: number;
}
