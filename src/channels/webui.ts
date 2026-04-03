/**
 * Web UI - 简单的Web界面
 */

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface WebUIConfig {
  port?: number;
  title?: string;
}

export class WebUI {
  private config: WebUIConfig;
  private server?: http.Server;

  constructor(config: WebUIConfig = {}) {
    this.config = {
      port: config.port ?? 18789,
      title: config.title ?? 'LxzClaw',
    };
  }

  async start(): Promise<void> {
    const app = express();

    app.use(express.static(path.join(process.cwd(), 'public')));

    app.get('/', (_req: Request, res: Response) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>${this.config.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; min-height: 100vh; display: flex; }
    .sidebar { width: 260px; background: #16213e; padding: 20px; display: flex; flex-direction: column; }
    .sidebar h1 { font-size: 24px; margin-bottom: 20px; color: #0f3460; }
    .sidebar h1 span { color: #e94560; }
    .sessions { flex: 1; overflow-y: auto; }
    .session { padding: 10px; margin: 5px 0; background: #0f3460; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .session:hover { background: #1a4a7a; }
    .session.active { background: #e94560; }
    .main { flex: 1; display: flex; flex-direction: column; }
    .header { padding: 20px; background: #16213e; border-bottom: 1px solid #0f3460; }
    .header h2 { color: #e94560; }
    .messages { flex: 1; padding: 20px; overflow-y: auto; }
    .message { margin: 10px 0; padding: 12px 16px; border-radius: 12px; max-width: 70%; }
    .message.user { background: #0f3460; margin-left: auto; }
    .message.assistant { background: #16213e; }
    .message.error { background: #e94560; color: #fff; }
    .input-area { padding: 20px; background: #16213e; display: flex; gap: 10px; }
    .input-area input { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #0f3460; background: #1a1a2e; color: #fff; font-size: 14px; }
    .input-area input:focus { outline: none; border-color: #e94560; }
    .input-area button { padding: 12px 24px; background: #e94560; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-weight: bold; }
    .input-area button:hover { background: #d63850; }
    .input-area button:disabled { background: #666; cursor: not-allowed; }
    .typing { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <div class="sidebar">
    <h1>Lxz<span>Claw</span></h1>
    <div class="sessions">
      <div class="session active">New Chat</div>
    </div>
  </div>
  <div class="main">
    <div class="header">
      <h2>Chat</h2>
    </div>
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <input type="text" id="input" placeholder="Type your message..." autofocus>
      <button id="send">Send</button>
    </div>
  </div>
  <script>
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    const messages = document.getElementById('messages');
    let sessionId = null;

    async function send() {
      const text = input.value.trim();
      if (!text) return;

      addMessage('user', text);
      input.value = '';
      sendBtn.disabled = true;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId })
        });
        const data = await res.json();
        sessionId = data.sessionId;
        addMessage('assistant', data.content);
      } catch (e) {
        addMessage('error', 'Error: ' + e.message);
      }

      sendBtn.disabled = false;
      input.focus();
    }

    function addMessage(role, content) {
      const div = document.createElement('div');
      div.className = 'message ' + role;
      div.textContent = content;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    sendBtn.onclick = send;
    input.onkeypress = e => { if (e.key === 'Enter') send(); };
  </script>
</body>
</html>
      `);
    });

    this.server = app.listen(this.config.port, () => {
      logger.info(`Web UI listening on http://localhost:${this.config.port}`);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }
}