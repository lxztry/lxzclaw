/**
 * WebSocket message handler
 */

import { WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { AgentEngine } from '../agent/index.js';
import { SessionManager } from '../session/index.js';
import { WSMessage, ChatPayload } from './types.js';
import { logger } from '../utils/logger.js';

export class WSHandler {
  private agent: AgentEngine;
  private sessionManager: SessionManager;
  private clients: Map<string, WebSocket> = new Map();
  private clientSessions: Map<string, string> = new Map(); // clientId -> sessionId

  constructor(agent: AgentEngine, sessionManager: SessionManager) {
    this.agent = agent;
    this.sessionManager = sessionManager;

    // Forward agent events to WebSocket clients
    this.agent.on('message', (sessionId, message) => {
      this.broadcastToSession(sessionId, {
        type: 'message',
        payload: message,
      });
    });

    this.agent.on('tool_call', (sessionId, tool) => {
      this.broadcastToSession(sessionId, {
        type: 'tool_call',
        payload: tool,
      });
    });

    this.agent.on('tool_result', (sessionId, result) => {
      this.broadcastToSession(sessionId, {
        type: 'tool_result',
        payload: result,
      });
    });

    this.agent.on('error', (sessionId, error) => {
      this.broadcastToSession(sessionId, {
        type: 'error',
        payload: { message: error.message },
      });
    });
  }

  handleConnection(ws: WebSocket, clientId?: string): string {
    const id = clientId ?? randomUUID();
    this.clients.set(id, ws);
    logger.debug(`WebSocket client connected: ${id}`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        await this.handleMessage(id, message);
      } catch (error) {
        logger.error(`WS message error: ${error}`);
        this.send(id, {
          type: 'error',
          payload: { message: error instanceof Error ? error.message : String(error) },
        });
      }
    });

    ws.on('close', () => {
      this.clients.delete(id);
      this.clientSessions.delete(id);
      logger.debug(`WebSocket client disconnected: ${id}`);
    });

    ws.on('error', (error) => {
      logger.error(`WS client error: ${error}`);
    });

    return id;
  }

  private async handleMessage(clientId: string, message: WSMessage): Promise<void> {
    logger.debug(`WS message: ${message.type}`);

    switch (message.type) {
      case 'chat': {
        const payload = message.payload as ChatPayload;
        const sessionId = payload.sessionId ?? this.clientSessions.get(clientId);

        // Create or use session
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const session = this.sessionManager.create({
            type: 'chat',
            userId: clientId,
          });
          activeSessionId = session.id;
          this.clientSessions.set(clientId, activeSessionId);
        }

        const response = await this.agent.processMessage(activeSessionId, payload.message, {
          stream: payload.stream,
          onChunk: (chunk) => {
            this.send(clientId, {
              type: 'chunk',
              id: message.id,
              payload: { chunk, sessionId: activeSessionId },
            });
          },
        });

        this.send(clientId, {
          type: 'response',
          id: message.id,
          payload: {
            content: response,
            sessionId: activeSessionId,
          },
        });
        break;
      }

      case 'create_session': {
        const { type = 'chat', workspace } = (message.payload ?? {}) as { type?: string; workspace?: string };
        const session = this.sessionManager.create({
          type: type as 'cli' | 'chat' | 'task',
          workspace,
        });
        this.clientSessions.set(clientId, session.id);

        this.send(clientId, {
          type: 'session_created',
          id: message.id,
          payload: { sessionId: session.id },
        });
        break;
      }

      case 'get_session': {
        const { sessionId } = message.payload as { sessionId: string };
        const session = await this.sessionManager.get(sessionId);

        this.send(clientId, {
          type: 'session',
          id: message.id,
          payload: { session },
        });
        break;
      }

      case 'list_sessions': {
        const sessions = this.sessionManager.listSessions();
        this.send(clientId, {
          type: 'sessions',
          id: message.id,
          payload: { sessions },
        });
        break;
      }

      case 'ping': {
        this.send(clientId, { type: 'pong' });
        break;
      }

      default:
        logger.warn(`Unknown WS message type: ${message.type}`);
    }
  }

  send(clientId: string, message: WSMessage): void {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastToSession(sessionId: string, message: WSMessage): void {
    for (const [clientId, session] of this.clientSessions) {
      if (session === sessionId) {
        this.send(clientId, message);
      }
    }
  }

  broadcast(message: WSMessage): void {
    for (const clientId of this.clients.keys()) {
      this.send(clientId, message);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
