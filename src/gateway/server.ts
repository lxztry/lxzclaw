/**
 * Gateway server - HTTP + WebSocket server
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { Config } from '../config/index.js';
import { SessionManager } from '../session/index.js';
import { AgentEngine } from '../agent/index.js';
import { WSHandler } from './ws-handler.js';
import { logger } from '../utils/logger.js';

export class GatewayServer {
  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private wsHandler: WSHandler | null = null;
  private config: Config;
  private agent: AgentEngine;
  private sessionManager: SessionManager;

  constructor(config: Config, agent: AgentEngine, sessionManager: SessionManager) {
    this.config = config;
    this.agent = agent;
    this.sessionManager = sessionManager;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && this.config.gateway.corsOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // JSON body parser
    this.app.use(express.json({ limit: '10mb' }));

    // Logging
    this.app.use((req, _res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });

    // Auth middleware
    if (this.config.gateway.authToken) {
      this.app.use((req, res, next) => {
        if (req.path === '/health') return next();
        
        const auth = req.headers.authorization;
        if (auth !== `Bearer ${this.config.gateway.authToken}`) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        next();
      });
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // REST API for chat
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { message, sessionId, stream } = req.body;

        if (!message) {
          res.status(400).json({ error: 'message is required' });
          return;
        }

        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const session = this.sessionManager.create({ type: 'chat' });
          activeSessionId = session.id;
        }

        if (stream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const response = await this.agent.processMessage(activeSessionId, message, { stream: true });
          res.write(`data: ${JSON.stringify({ done: true, content: response })}\n\n`);
          res.end();
        } else {
          const response = await this.agent.processMessage(activeSessionId, message);
          res.json({ response, sessionId: activeSessionId });
        }
      } catch (error) {
        logger.error(`Chat API error: ${error}`);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Session management
    this.app.get('/api/sessions', (_req, res) => {
      res.json({ sessions: this.sessionManager.listSessions() });
    });

    this.app.get('/api/sessions/:id', async (req, res) => {
      const session = await this.sessionManager.get(req.params.id);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.json({ session });
    });

    // Tools
    this.app.get('/api/tools', (_req, res) => {
      const { toolRegistry } = require('../tools/index.js');
      res.json({ tools: toolRegistry.getToolSchemas() });
    });

    // Webhook endpoint for channel integrations
    this.app.post('/api/webhook/:channel', (req, res) => {
      const { channel } = req.params;
      logger.debug(`Webhook received for channel: ${channel}`);
      res.json({ received: true, channel });
    });

    // Observability endpoints
    this.app.get('/api/observability/health', (_req, res) => {
      const { observability } = require('../observability/index.js');
      const agents = this.sessionManager.listSessions().length;
      res.json(observability.getHealthStatus(agents));
    });

    this.app.get('/api/observability/metrics', (req, res) => {
      const { observability } = require('../observability/index.js');
      const since = req.query.since ? parseInt(req.query.since as string) : undefined;
      if (req.query.name) {
        res.json({ metrics: observability.getMetrics(req.query.name as string, since) });
      } else {
        res.json(observability.getAllMetrics());
      }
    });

    this.app.get('/api/observability/tasks', (req, res) => {
      const { observability } = require('../observability/index.js');
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const since = req.query.since ? parseInt(req.query.since as string) : undefined;
      res.json({ tasks: observability.getTaskHistory(limit, since) });
    });

    this.app.get('/api/observability/summary', (_req, res) => {
      const { observability } = require('../observability/index.js');
      res.json(observability.getSummary());
    });

    this.app.post('/api/observability/webhooks', (req, res) => {
      const { observability } = require('../observability/index.js');
      const { url, events, headers } = req.body;
      observability.registerWebhook({ url, events: events ?? ['*'], headers });
      res.json({ success: true });
    });

    // Serve static web UI
    const staticPath = path.join(process.cwd(), 'src', 'web', 'static');
    this.app.use(express.static(staticPath));
    this.app.use((_req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  async start(): Promise<void> {
    const { port, host } = this.config.gateway;

    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        this.wsHandler = new WSHandler(this.agent, this.sessionManager);

        this.wss.on('connection', (ws: WebSocket) => {
          this.wsHandler!.handleConnection(ws);
        });

        this.server!.listen(port, host, () => {
          logger.info(`Gateway listening on http://${host}:${port}`);
          logger.info(`WebSocket available at ws://${host}:${port}`);
          resolve();
        });

        this.server!.on('error', (error) => {
          logger.error(`Server error: ${error}`);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    logger.info('Stopping gateway...');

    if (this.wss) {
      this.wss.close();
    }

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
    }

    logger.info('Gateway stopped');
  }

  getClientCount(): number {
    return this.wsHandler?.getClientCount() ?? 0;
  }
}
