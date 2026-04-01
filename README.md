# 🦞 LxzClaw

> AI Agent Gateway & Coding Assistant - 融合OpenClaw多通道架构与Claude Code交互模式

## Features

### 🎯 Core Capabilities
- **多通道接入**: CLI / Web UI / 飞书 / WebSocket
- **工具系统**: bash, read, write, edit, glob, web搜索
- **多Agent协同**: Supervisor/Worker模式，支持并行任务执行
- **会话管理**: 持久化会话历史，支持多种会话类型

### 🏗️ Architecture

```
LxzClaw
├── Gateway Server (HTTP + WebSocket)
├── Agent Engine (LLM + Tools)
├── Multi-Agent Coordinator
├── Channel Plugins (Feishu, CLI, Web)
└── Skill System (Hot-loadable)
```

## Quick Start

### Installation

```bash
git clone https://github.com/lxztry/lxzclaw.git
cd lxzclaw
npm install
npm run build
```

### Configuration

Create `.env` file or set environment variables:

```bash
LXZ_ANTHROPIC_API_KEY=your-api-key
LXZ_MODEL=claude-sonnet-4-20250514
LXZ_GATEWAY_PORT=18789
```

Or create `~/.lxzclaw/lxzclaw.json`:

```json
{
  "llm": {
    "provider": "anthropic",
    "apiKey": "your-api-key",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### Usage

**Interactive CLI:**
```bash
npm run cli
# or
node dist/index.js
```

**Gateway Mode (for web/channels):**
```bash
npm run gateway
# or
node dist/index.js gateway
```

**Single Chat:**
```bash
node dist/index.js chat "Hello, help me write a function"
```

**Web UI:**
Open `http://localhost:18789` in your browser

## Project Structure

```
lxzclaw/
├── src/
│   ├── agent/          # Agent engine + multi-agent
│   ├── channels/       # Feishu, CLI, Web channels
│   ├── cli/           # Terminal UI
│   ├── config/         # Configuration management
│   ├── gateway/        # HTTP/WebSocket server
│   ├── session/        # Session management
│   ├── skills/         # Skill system
│   ├── tools/          # Tool registry + built-in tools
│   └── utils/          # Logger, async utilities
├── dist/               # Compiled output
├── SPEC.md             # Detailed specification
└── package.json
```

## Multi-Agent System

```javascript
const { MultiAgentCoordinator, AgentTemplates } = require('lxzclaw');

const coordinator = new MultiAgentCoordinator(config, sessionManager);

// Register agents
await coordinator.registerAgent(AgentTemplates.supervisor('SuperAgent'));
await coordinator.registerAgent(AgentTemplates.coder('CodeBot'));

// Create and execute tasks
const task = coordinator.createTask('Write a hello world function', { priority: 'high' });
await coordinator.executeTask(task.id);
```

## Tools

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands |
| `read` | Read file contents |
| `write` | Write/create files |
| `edit` | Edit files by replacing text |
| `glob` | Find files by pattern |
| `web_search` | Search the web |
| `web_fetch` | Fetch URL content |

## API Endpoints

### REST API

- `GET /health` - Health check
- `POST /api/chat` - Send chat message
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:id` - Get session
- `GET /api/tools` - List tools

### Observability API

- `GET /api/observability/health` - System health status
- `GET /api/observability/metrics` - All metrics
- `GET /api/observability/metrics?name=xxx` - Specific metric
- `GET /api/observability/tasks` - Task history
- `GET /api/observability/summary` - System summary
- `POST /api/observability/webhooks` - Register webhook

### WebSocket

Connect to `ws://localhost:18789` and send JSON messages:

```javascript
// Create session
ws.send(JSON.stringify({ type: 'create_session', payload: { type: 'chat' } }));

// Send message
ws.send(JSON.stringify({ type: 'chat', payload: { message: 'Hello!' } }));
```

## Development

```bash
# Build
npm run build

# Development with watch
npm run dev

# Run tests
npm test
```

## License

MIT
