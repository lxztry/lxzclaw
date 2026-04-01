# LxzClaw - AI Agent Gateway & Coding Assistant

## Concept & Vision

LxzClaw 是一个融合了 **OpenClaw 多通道网关架构** 与 **Claude Code CLI 交互模式** 的 AI Agent 框架。它既是跨平台的消息网关（支持飞书、Telegram、Discord等），又是强大的命令行编码助手。

**核心理念**: "本地优先，工具增强，通道无界" — 用户可以在任何地方通过任何渠道与同一个 AI Agent 交互，同时享受完整的编码工具能力。

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      LxzClaw                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   CLI UI    │  │   Web UI    │  │  Channel Plugins │ │
│  │  (Terminal) │  │  (Browser)  │  │ (Feishu/Discord) │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                    │          │
│         └────────────────┼────────────────────┘          │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Gateway Server (Express + WS)           ││
│  │  - Session Management                                ││
│  │  - Message Routing                                   ││
│  │  - Tool Execution                                    ││
│  │  - Auth & Rate Limiting                             ││
│  └──────────────────────────┬──────────────────────────┘│
│                             │                            │
│  ┌──────────────────────────▼──────────────────────────┐│
│  │                   Agent Engine                       ││
│  │  - LLM Integration (Claude/MiniMax/GPT)             ││
│  │  - Tool System (File/Shell/Browser)                ││
│  │  - Skill Loader                                     ││
│  │  - Memory & Context                                 ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Design Language

### CLI Aesthetic
- **Style**: Modern terminal with syntax highlighting (chalk + syntax highlighter)
- **Color Palette**:
  - Primary: `#10B981` (emerald green) - success/AI responses
  - Secondary: `#3B82F6` (blue) - user input
  - Accent: `#F59E0B` (amber) - warnings/tools
  - Error: `#EF4444` (red)
  - Background: Dark theme by default, light theme optional
- **Typography**: Monospace (JetBrains Mono / Fira Code fallback)
- **Prompt**: `lxzclaws > ` with colored prefix based on mode

### Web UI
- Clean, minimal dashboard with real-time chat view
- Uses modern CSS with CSS variables for theming
- Font: Inter for UI, JetBrains Mono for code

---

## Core Features

### 1. Gateway System
- **WebSocket Server**: Real-time bidirectional communication
- **HTTP REST API**: For channel integrations and webhooks
- **Session Management**: Per-user, per-conversation isolation
- **Message Queue**: Async processing with priority support
- **Channel Routing**: Dynamic routing based on sender/channel metadata

### 2. Channel Integrations
| Channel | Status | Implementation |
|---------|--------|----------------|
| Feishu (飞书) | Primary | WebSocket + REST webhook |
| CLI | Primary | PTY-based interactive terminal |
| Web | Primary | Browser WebSocket |
| Telegram | Planned | Bot API |
| Discord | Planned | Bot API |

### 3. Agent Capabilities
- **LLM Providers**: Claude (Anthropic), MiniMax, OpenAI-compatible
- **Tool System**: 
  - File operations (read/write/edit)
  - Shell command execution
  - Web search and fetch
  - Browser automation
  - Git operations
- **Skill System**: Hot-loadable skill modules (like OpenClaw's skills)
- **Multi-Agent Coordination** ✅ (NEW):
  - Supervisor/worker pattern
  - Specialist agents (coder, researcher, reviewer)
  - Parallel task execution
  - Inter-agent messaging
  - Task dependencies and scheduling

- **Observability System** ✅ (NEW):
  - Task metrics and tracking
  - Task timeline/history
  - Structured logging
  - Health checks (`/api/observability/health`)
  - Metrics API (`/api/observability/metrics`)
  - Task history API (`/api/observability/tasks`)
  - Webhook notifications

### 4. Session & Memory
- **Session Types**: 
  - `cli`: Interactive terminal session
  - `chat`: Conversational session
  - `task`: Background task session
- **Memory Hierarchy**:
  - Working memory: Current conversation
  - Project memory: Per-workspace context
  - Long-term memory: Persistent knowledge base

---

## Project Structure

```
lxzclaw/
├── src/
│   ├── observability/  # Metrics, health, webhooks
│   ├── cli/           # CLI entry point and TUI
│   │   ├── index.ts          # Main CLI entry
│   │   ├── commands.ts       # Command definitions
│   │   ├── tui.ts            # Terminal UI
│   │   └── ansi.ts           # ANSI formatting
│   │
│   ├── gateway/        # WebSocket/HTTP gateway
│   │   ├── server.ts         # Express + WS server
│   │   ├── router.ts         # Message routing
│   │   ├── auth.ts           # Authentication
│   │   └── ws-handler.ts     # WebSocket handlers
│   │
│   ├── agent/          # Agent engine
│   │   ├── engine.ts         # Main agent loop
│   │   ├── llm.ts            # LLM provider abstraction
│   │   ├── providers/        # Provider implementations
│   │   │   ├── anthropic.ts
│   │   │   ├── minimax.ts
│   │   │   └── openai.ts
│   │   └── context.ts        # Context management
│   │
│   ├── tools/          # Tool system
│   │   ├── registry.ts       # Tool registry
│   │   ├── executor.ts       # Tool execution
│   │   ├── tools/            # Built-in tools
│   │   │   ├── bash.ts
│   │   │   ├── read.ts
│   │   │   ├── write.ts
│   │   │   ├── edit.ts
│   │   │   ├── web.ts
│   │   │   └── git.ts
│   │   └── schema.ts         # Tool schemas
│   │
│   ├── skills/        # Skill system
│   │   ├── loader.ts         # Skill loader
│   │   ├── registry.ts       # Skill registry
│   │   └── executor.ts       # Skill execution
│   │
│   ├── channels/      # Channel implementations
│   │   ├── base.ts          # Base channel interface
│   │   ├── feishu.ts        # Feishu implementation
│   │   ├── cli.ts           # CLI channel
│   │   └── web.ts           # Web channel
│   │
│   ├── session/       # Session management
│   │   ├── manager.ts       # Session manager
│   │   ├── store.ts         # Session storage
│   │   └── types.ts         # Session types
│   │
│   ├── web/           # Web UI
│   │   ├── static/          # Static assets
│   │   ├── index.html       # Main HTML
│   │   └── app.ts           # Frontend app
│   │
│   ├── config/        # Configuration
│   │   ├── loader.ts        # Config loading
│   │   ├── schema.ts        # Config schema
│   │   └── defaults.ts      # Default values
│   │
│   └── utils/         # Utilities
│       ├── logger.ts        # Logging
│       ├── crypto.ts        # Crypto utils
│       └── async.ts         # Async utilities
│
├── skills/            # User skills (hot-loadable)
├── data/             # Data storage
│   ├── sessions/     # Session data
│   └── memory/       # Memory storage
├── package.json
├── tsconfig.json
└── README.md
```

---

## Interface Modes

### CLI Mode
```bash
# Start interactive CLI
lxzclaw

# Start with specific session
lxzclaw --session <session-id>

# Start gateway only
lxzclaw gateway

# Send single command
lxzclaw --chat "Hello, help me write a function"
```

### Web Mode
```bash
# Start web server
lxzclaw web --port 8080

# Browser access at http://localhost:8080
```

### Gateway Mode
```bash
# Start gateway for channel integrations
lxzclaw gateway --port 18789 --ws

# Connect channels
lxzclaw channel add feishu --webhook /webhook/feishu
```

---

## Technical Decisions

### Language & Runtime
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 22+
- **Module System**: ES Modules

### Key Dependencies
- `express` - HTTP server
- `ws` - WebSocket server
- `zod` - Schema validation
- `chalk` - Terminal colors
- `@anthropic-ai/sdk` - Claude SDK
- `zod` - Configuration schema

### Protocol
- Gateway-Agent communication: JSON-RPC over WebSocket
- Channel-Gateway: REST webhooks + WebSocket
- Tool execution: Direct Node.js with sandbox

---

## Quality Checklist

- [ ] Gateway starts on configured port
- [ ] WebSocket connections establish correctly
- [ ] CLI interactive mode works with ANSI colors
- [ ] LLM responses stream correctly
- [ ] File read/write tools execute properly
- [ ] Shell command tools execute with timeout
- [ ] Session persistence works
- [ ] Feishu channel receives and sends messages
- [ ] Skill loading works
- [ ] Error handling is graceful
- [ ] Logs are structured and useful
