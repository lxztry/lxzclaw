# 🦞 LxzClaw

> AI Agent Gateway & Coding Assistant - 融合OpenClaw多通道架构与Claude Code交互模式

## Features

### 🎯 Core Capabilities
- **多LLM Provider**: 支持 Anthropic、MiniMax、GLM、OpenRouter、OpenAI 等
- **多Agent协作**: 完整的工作流系统，支持 Supervisor/Worker 模式
- **内置MCP服务器**: Filesystem、Git、WebSearch 开箱即用
- **预设工作流**: 代码审查、DevOps、文档生成、Bug修复、特性开发
- **中文Prompt优化**: 原生中文代码注释、文档生成、审查反馈
- **多通道接入**: CLI / Web UI / WebSocket / Discord / Telegram / 飞书
- **工具系统**: bash, read, write, edit, glob, web搜索
- **智能Agent**: 反思机制、自动重试、任务规划
- **Skills系统**: 热加载技能模块，支持依赖管理
- **会话管理**: 持久化会话历史，支持多种会话类型

### 🔥 核心差异化
| 能力 | Claude Code | OpenClaw | LxzClaw |
|------|-------------|-----------|----------|
| Agent Teams | ✅ | ❌ | ✅ **完整实现** |
| Subagent | ✅ | ✅ | ✅ |
| 多Agent路由 | ✅ Teams | ✅ 多规则路由 | ✅ |
| Agent通信 | ✅ Mailbox | ⚠️ 需通过父Agent | ✅ **Mailbox直连** |
| 预设工作流 | ❌ | ⚠️ Lobster需配置 | ✅ **开箱即用** |
| 中文优化 | ❌ | ❌ | ✅ **原生中文** |
| 国内模型 | ❌ | ⚠️ Ollama中转 | ✅ **直接支持** |
| 多通道 | ❌ | ✅ 全通道 | ✅ |
| MCP协议 | ✅ | ⚠️ Built-in | ✅ |
| 自托管 | ❌ | ✅ | ✅ |

### 🤖 Agent Teams (类 Claude Code 架构)

LxzClaw 支持真正的 Agent Teams 架构：

```typescript
import { AgentTeam, AgentTeamFactory } from './agent/teams.js';

// 创建代码审查 Team
const team = AgentTeamFactory.createCodeReviewTeam();

// 添加任务
team.createTask({ title: '审查登录功能', priority: 'high' });

// 运行 Team (Team Lead 自动协调)
await team.run();
```

**Team 特性：**
- ✅ **Team Lead** - 主管协调任务分配
- ✅ **Mailbox** - Agent 间直接消息传递
- ✅ **共享 Task List** - 任务状态同步
- ✅ **独立 Member** - 每个 Member 有自己的上下文
- ✅ **状态追踪** - 实时监控所有 Agent 状态

### 🏗️ Architecture

```
LxzClaw
├── Gateway Server (HTTP + WebSocket)
├── Agent Engine (LLM + Tools)
│   ├── Smart Agent (反思/重试/规划)
│   └── MCP Client (协议支持)
├── Multi-Agent Coordinator
├── Channel Plugins (CLI, Web, Discord, Telegram, Feishu)
├── Skill System (Hot-loadable, 依赖管理)
└── Audit Logger (安全审计)
```

## Quick Start

### 1. 安装

```bash
# 克隆项目
git clone https://github.com/lxztry/lxzclaw.git
cd lxzclaw

# 安装依赖
npm install

# 编译
npm run build
```

### 2. 全局安装 (可选)

```bash
npm install -g .
```

全局安装后，`.env` 文件会自动复制到全局模块目录。

### 3. 配置

创建 `.env` 文件：

```bash
# LLM Provider (可选: anthropic, minimax, glm, openrouter, openai)
LXZ_LLM_PROVIDER=glm

# GLM 配置
LXZ_GLM_API_KEY=你的API密钥
LXZ_GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LXZ_MODEL=glm-4-flash

# 或 MiniMax 配置
# LXZ_LLM_PROVIDER=minimax
# LXZ_MINIMAX_API_KEY=你的API密钥
# LXZ_MODEL=MiniMax-M2.7

# 或 OpenRouter 配置
# LXZ_LLM_PROVIDER=openrouter
# LXZ_OPENROUTER_API_KEY=你的API密钥
# LXZ_MODEL=anthropic/claude-3.5-sonnet

# 网关配置
LXZ_GATEWAY_PORT=18789
LXZ_GATEWAY_HOST=127.0.0.1

# 日志
LXZ_LOG_LEVEL=info
```

### 4. 运行

**交互模式 (CLI):**
```bash
# 全局安装后
lxzclaw

# 或直接运行
node dist/index.js

# 或开发模式
npm run dev
```

**网关模式 (HTTP/WebSocket):**
```bash
npm run gateway
# 或
node dist/index.js gateway
```

**单次对话:**
```bash
node dist/index.js chat "帮我写一个hello world函数"
```

**Web UI:**
打开 `http://localhost:18789`

## 项目结构

```
lxzclaw/
├── src/
│   ├── agent/          # Agent 引擎 + 多Agent协调
│   ├── cli/           # 终端UI
│   ├── config/        # 配置管理
│   ├── gateway/       # HTTP/WebSocket服务器
│   ├── session/       # 会话管理
│   ├── tools/         # 工具注册 + 内置工具
│   └── utils/         # 日志、工具函数
├── dist/               # 编译输出
├── SPEC.md             # 详细技术规格
└── package.json
```

## LLM Provider 配置

### GLM (智谱AI) - 推荐国内用户

```bash
LXZ_LLM_PROVIDER=glm
LXZ_GLM_API_KEY=你的API密钥
LXZ_GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LXZ_MODEL=glm-4-flash
```

### MiniMax

```bash
LXZ_LLM_PROVIDER=minimax
LXZ_MINIMAX_API_KEY=你的API密钥
LXZ_MINIMAX_BASE_URL=https://api.minimaxi.com/v1
LXZ_MODEL=MiniMax-M2.7
```

**注意**: MiniMax Token Plan (sk-cp- 开头) 需要OAuth认证，标准API Key (sk- 开头) 可直接使用。

### OpenRouter

```bash
LXZ_LLM_PROVIDER=openrouter
LXZ_OPENROUTER_API_KEY=你的API密钥
LXZ_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LXZ_MODEL=anthropic/claude-3.5-sonnet
```

### Anthropic

```bash
LXZ_LLM_PROVIDER=anthropic
LXZ_ANTHROPIC_API_KEY=你的API密钥
LXZ_MODEL=claude-sonnet-4-20250514
```

## 工具

| 工具 | 说明 | 需要确认 |
|------|------|---------|
| `bash` | 执行Shell命令 | ✅ |
| `read` | 读取文件内容 | ❌ |
| `write` | 写入/创建文件 | ✅ |
| `edit` | 编辑文件 (替换文本) | ✅ |
| `glob` | 按模式查找文件 | ❌ |
| `web_search` | 搜索网页 | ❌ |
| `web_fetch` | 获取URL内容 | ❌ |

> 注：敏感操作 (bash, write, edit) 会记录到审计日志

## MCP 支持

LxzClaw 支持 MCP (Model Context Protocol)，内置三种服务器，开箱即用：

### 内置 MCP 服务器

| 服务器 | 工具数 | 说明 |
|--------|--------|------|
| **Filesystem** | 8个 | 文件系统操作 |
| **Git** | 8个 | Git 版本控制 |
| **Web Search** | 4个 | 网页搜索和获取 |

详细文档：[MCP_EXTENSIONS.md](MCP_EXTENSIONS.md)

### 快速启用

```yaml
mcp:
  filesystem:
    enabled: true
  git:
    enabled: true
  websearch:
    enabled: true
```

### 第三方 MCP 服务器

```json
{
  "mcp": {
    "servers": [
      {
        "name": "github",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "enabled": true
      }
    ]
  }
}
```

## Skills 系统

Skills 是热加载的模块，扩展 Agent 能力。

### 创建 Skill

在 `skills/` 目录下创建：

```typescript
// skills/hello/index.ts
export default {
  skill: {
    name: 'hello',
    description: '打招呼技能',
    version: '1.0.0',
    author: 'Your Name',
    tags: ['utility'],
    dependencies: {},
  },
  async execute(input: unknown) {
    return `Hello, ${input}!`;
  },
};
```

### Skill 特性

- **热加载**: 修改后自动重载
- **依赖管理**: 支持技能间依赖
- **Tag 分类**: 按标签查询

## 智能 Agent

- **自动重试**: 工具失败时自动重试 (指数退避)
- **反思机制**: 分析工具失败原因，提供改进建议
- **任务规划**: 复杂任务自动分解为步骤

## 通道集成

| 通道 | 说明 |
|------|------|
| CLI | 交互式终端 |
| Web UI | 浏览器界面 (http://localhost:18789) |
| WebSocket | 实时消息 |
| Discord | Discord Bot |
| Telegram | Telegram Bot |
| 飞书 | 飞书消息 (beta) |

## API 接口

### REST API

- `GET /health` - 健康检查
- `POST /api/chat` - 发送聊天消息
- `GET /api/sessions` - 列出会话
- `GET /api/sessions/:id` - 获取会话
- `GET /api/tools` - 列出工具

### WebSocket

连接 `ws://localhost:18789`，发送JSON消息：

```javascript
// 创建会话
ws.send(JSON.stringify({ type: 'create_session', payload: { type: 'chat' } }));

// 发送消息
ws.send(JSON.stringify({ type: 'chat', payload: { message: 'Hello!' } }));
```

## 常见问题

### 1. Windows 上运行 lxzclaw 提示找不到命令

确保 Node.js 全局目录在 PATH 中：
- 打开 "系统属性" → "高级" → "环境变量"
- 在用户变量 PATH 中添加 `D:\NodeJS\node_global`

或直接使用完整路径：
```bash
node D:\code\lxzclaw\dist\index.js
```

### 2. API Key 无效

- 检查 Key 是否正确
- 确认账户有余额
- MiniMax Token Plan Key 需要OAuth认证

### 3. 模型不存在

确保 `LXZ_MODEL` 与 Provider 支持的模型名称匹配。

## 开发

```bash
# 编译
npm run build

# 开发模式 (热重载)
npm run dev

# 运行测试
npm test
```

## License

MIT
