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
import { AuthManager, RateLimiter } from '../auth/index.js';
import { FeishuChannel } from '../channels/index.js';
import { toolRegistry } from '../tools/index.js';
import { observability } from '../observability/index.js';

export class GatewayServer {
  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private wsHandler: WSHandler | null = null;
  private config: Config;
  private agent: AgentEngine;
  private sessionManager: SessionManager;
  private authManager: AuthManager;
  private rateLimiter: RateLimiter;
  private feishuChannel: FeishuChannel | null = null;

  constructor(config: Config, agent: AgentEngine, sessionManager: SessionManager) {
    this.config = config;
    this.agent = agent;
    this.sessionManager = sessionManager;
    this.app = express();
    
    // Initialize auth
    this.authManager = new AuthManager({
      enabled: !!config.gateway.authToken,
      tokens: config.gateway.authToken ? [config.gateway.authToken] : undefined,
    });
    this.rateLimiter = new RateLimiter(60000, 100);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use((_req, res, next) => {
      res.setHeader('X-DNS-Prefetch-Control', 'off');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

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

    // Rate limiting middleware
    this.app.use((req, res, next) => {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
        ?? req.socket.remoteAddress 
        ?? 'unknown';
      
      const result = this.rateLimiter.check(clientIp);
      res.setHeader('X-RateLimit-Limit', String(this.rateLimiter['max']));
      res.setHeader('X-RateLimit-Remaining', String(result.remaining));
      res.setHeader('X-RateLimit-Reset', String(result.resetAt));
      
      if (!result.allowed) {
        res.status(429).json({ error: 'Rate limit exceeded', retryAfter: result.resetAt });
        return;
      }
      next();
    });

    // Auth middleware
    this.app.use((req, res, next) => {
      // Public endpoints
      if (req.path === '/health' || req.path === '/') {
        return next();
      }

      const authResult = this.authManager.authenticate(req.headers.authorization);
      if (!authResult.success) {
        res.status(401).json({ error: authResult.error ?? 'Unauthorized' });
        return;
      }
      
      // Attach auth info to request
      (req as typeof req & { auth: typeof authResult }).auth = authResult;
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Auth endpoints
    this.app.post('/api/auth/token', (req: express.Request, res: express.Response) => {
      const { userId, name, expiresIn, scopes } = req.body;
      const token = this.authManager.generateToken({
        userId: userId ?? 'default',
        name,
        expiresIn,
        scopes,
      });
      res.json({ token, message: 'Store this token securely - it will not be shown again' });
    });

    this.app.get('/api/auth/tokens', (_req, res) => {
      const tokens = this.authManager.listTokens();
      res.json({ tokens });
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

    // ============== Channel Message History APIs ==============
    // Extensible design for multi-channel message history

    // List all channels with session counts
    this.app.get('/api/channels', async (_req, res) => {
      const allSessions = this.sessionManager.listSessions();
      const channelMap = new Map<string, { sessionCount: number; latestMessage: number }>();

      for (const sessionId of allSessions) {
        const session = await this.sessionManager.get(sessionId);
        if (!session) continue;

        const channelId = session.metadata?.channelId || 'unknown';
        const existing = channelMap.get(channelId);

        if (existing) {
          existing.sessionCount++;
          if (session.updatedAt > existing.latestMessage) {
            existing.latestMessage = session.updatedAt;
          }
        } else {
          channelMap.set(channelId, {
            sessionCount: 1,
            latestMessage: session.updatedAt
          });
        }
      }

      const channels = Array.from(channelMap.entries()).map(([id, data]) => ({
        id,
        sessionCount: data.sessionCount,
        latestMessage: data.latestMessage,
        latestMessageAt: new Date(data.latestMessage).toISOString()
      }));

      res.json({ channels });
    });

    // Get sessions for a specific channel
    this.app.get('/api/channels/:channel/sessions', async (req, res) => {
      const { channel } = req.params;
      const allSessions = this.sessionManager.listSessions();
      const channelSessions: any[] = [];

      for (const sessionId of allSessions) {
        const session = await this.sessionManager.get(sessionId);
        if (!session) continue;

        // Match by channelId in metadata or session type
        const sessionChannel = session.metadata?.channelId || session.type;
        if (sessionChannel !== channel) continue;

        const lastMessage = session.messages.length > 0
          ? session.messages[session.messages.length - 1]
          : null;

        channelSessions.push({
          id: session.id,
          userId: session.metadata?.userId || 'unknown',
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messages.length,
          lastMessage: lastMessage ? {
            role: lastMessage.role,
            content: lastMessage.content.substring(0, 100),
            timestamp: lastMessage.timestamp
          } : null
        });
      }

      // Sort by latest activity
      channelSessions.sort((a, b) => b.updatedAt - a.updatedAt);

      res.json({ channel, sessions: channelSessions });
    });

    // Get messages for a specific session in a channel
    this.app.get('/api/channels/:channel/sessions/:sessionId', async (req, res) => {
      const { channel, sessionId } = req.params;
      const session = await this.sessionManager.get(sessionId);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Verify channel matches
      const sessionChannel = session.metadata?.channelId || session.type;
      if (sessionChannel !== channel) {
        res.status(404).json({ error: 'Session not found for this channel' });
        return;
      }

      const messages = session.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        timestampAt: new Date(msg.timestamp).toLocaleString('zh-CN')
      }));

      res.json({
        session: {
          id: session.id,
          userId: session.metadata?.userId,
          channel,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: messages.length
        },
        messages
      });
    });

    // ============== End Channel APIs ==============

    // Tools
    this.app.get('/api/tools', (_req, res) => {
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
      const agents = this.sessionManager.listSessions().length;
      res.json(observability.getHealthStatus(agents));
    });

    this.app.get('/api/observability/metrics', (req, res) => {
      const since = req.query.since ? parseInt(req.query.since as string) : undefined;
      if (req.query.name) {
        res.json({ metrics: observability.getMetrics(req.query.name as string, since) });
      } else {
        res.json(observability.getAllMetrics());
      }
    });

    this.app.get('/api/observability/tasks', (req, res) => {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const since = req.query.since ? parseInt(req.query.since as string) : undefined;
      res.json({ tasks: observability.getTaskHistory(limit, since) });
    });

    this.app.get('/api/observability/summary', (_req, res) => {
      res.json(observability.getSummary());
    });

    this.app.post('/api/observability/webhooks', (req, res) => {
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

        this.server!.listen(port, host, async () => {
          logger.info(`Gateway listening on http://${host}:${port}`);
          logger.info(`WebSocket available at ws://${host}:${port}`);

          // Initialize Feishu channel AFTER server is created (so we can pass app/server)
          await this.initFeishuChannel();

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

  private async initFeishuChannel(): Promise<void> {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
      logger.info('Feishu channel not configured (missing APP_ID or APP_SECRET)');
      return;
    }

    try {
      this.feishuChannel = new FeishuChannel();

      this.feishuChannel.on('message', async (msg) => {
        logger.info(`Feishu message received from ${msg.senderName}: ${msg.content}`);

        // Create a new session for this Feishu user
        const session = this.sessionManager.create({
          type: 'chat',  // Use 'chat' type for Feishu conversations
          userId: msg.senderId
        });

        logger.info(`Created Feishu session: ${session.id} for user ${msg.senderName}`);

        const response = await this.agent.processMessage(session.id, msg.content);
        await this.feishuChannel!.send({
          recipientId: msg.senderId,
          content: response,
          metadata: { msgType: 'text' }
        });
      });

      // Pass shared app and server so Feishu webhook runs on same port as gateway
      // Default to WebSocket mode (no public URL needed), can be overridden via connectionMode config
      const connectionMode = (process.env.FEISHU_CONNECTION_MODE as 'websocket' | 'webhook') || 'websocket';
      await this.feishuChannel.initialize({
        type: 'feishu',
        enabled: true,
        connectionMode,
        sharedApp: this.app,
        sharedServer: this.server ?? undefined
      });
      await this.feishuChannel.start();
      logger.info('Feishu channel initialized (webhook on same port as gateway)');
    } catch (error) {
      logger.error('Failed to initialize Feishu channel:', error);
    }
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
