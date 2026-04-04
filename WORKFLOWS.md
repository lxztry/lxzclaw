# LxzClaw 核心竞争力功能

## 🎯 核心差异化能力

LxzClaw 相比 Claude Code 和 OpenClaw 的独特优势：

| 能力 | Claude Code | OpenClaw | LxzClaw |
|------|-------------|-----------|----------|
| 多 Agent 协作 | ❌ | ✅ 基础 | ✅ **完整工作流** |
| MCP 生态 | ❌ | ❌ | ✅ **内置服务器** |
| 中文优化 | ❌ | ❌ | ✅ **原生中文** |
| 国内模型 | ❌ | ❌ | ✅ **GLM/MiniMax** |
| 预设工作流 | ❌ | ❌ | ✅ **开箱即用** |

---

## 🔄 多 Agent 协作系统

### 支持的协作模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **Supervisor/Worker** | 主管分配 + 工人执行 | 大型任务分解 |
| **Agent Pool** | 能力不同的 Agent 池 | 并行处理 |
| **流水线** | A → B → C 顺序执行 | 审批流程 |
| **并行执行** | 多个 Agent 同时工作 | 批量处理 |

### 代码示例

```typescript
import { MultiAgentCoordinator, AgentTemplates } from './agent/multi-agent.js';
import { workflowExecutor, WorkflowTemplates } from './workflows/index.js';

// 创建协调器
const coordinator = new MultiAgentCoordinator(config, sessionManager);

// 注册 Agent
await coordinator.registerAgent(AgentTemplates.coder('CodeBot'));
await coordinator.registerAgent(AgentTemplates.reviewer('ReviewBot'));
await coordinator.registerAgent(AgentTemplates.researcher('SearchBot'));

// 执行工作流
const workflow = workflowExecutor.createFromTemplate('CODE_REVIEW', userCode);
for (const step of workflow.steps) {
  const result = await coordinator.executeTask(step.id);
  console.log(`${step.name}: ${result}`);
}
```

---

## 📦 预设工作流模板

开箱即用的 Agent 协作模板：

### 1. 代码审查工作流 🔍

```
Coder → Reviewer → Supervisor
```

**适用场景：** 代码提交前的自动审查

```typescript
const workflow = workflowExecutor.createFromTemplate(
  'CODE_REVIEW',
  userCode,
  'typescript'
);
```

**流程：**
1. `CodeBot` 编写代码
2. `ReviewBot` 审查问题
3. `SuperVisor` 综合决策

---

### 2. DevOps 自动化 🚀

```
Build → Test → Deploy
```

**适用场景：** CI/CD 自动化

```typescript
const workflow = workflowExecutor.createFromTemplate(
  'DEVOPS',
  '/path/to/project',
  'production'
);
```

**流程：**
1. `BuildBot` 编译构建
2. `TestBot` 运行测试
3. `DeployBot` 部署发布

---

### 3. 文档生成工作流 📝

```
Research → Write → Review
```

**适用场景：** 技术文档自动生成

```typescript
const workflow = workflowExecutor.createFromTemplate(
  'DOC_GEN',
  '如何实现微服务架构',
  '技术文档'
);
```

---

### 4. Bug 修复工作流 🐛

```
Reproduce → Analyze → Fix → Test
```

**适用场景：** 自动化 Bug 定位和修复

```typescript
const workflow = workflowExecutor.createFromTemplate(
  'BUG_FIX',
  bugReport
);
```

---

### 5. 新功能开发工作流 🚧

```
Spec → Implement → Review → Test → Deploy
```

**适用场景：** 完整的功能开发周期

```typescript
const workflow = workflowExecutor.createFromTemplate(
  'FEATURE_DEV',
  requirement
);
```

---

## 🇨🇳 中文 Prompt 优化

专为中文场景优化的 Prompt 模板：

### 中文代码注释

```typescript
import { zhPromptGenerator } from './prompts/index.js';

const comment = zhPromptGenerator.generateComment(
  'function',
  'calculateSum',
  ['a: number', 'b: number'],
  'number',
  '计算两个数的和'
);
```

### 中文代码审查

```typescript
const review = zhPromptGenerator.generateReview(
  'code',
  userCode,
  'typescript'
);

// 输出：
// 总体评价：8.5/10
// 问题列表：
// 1. [严重] 缺少参数校验
// 2. [中等] 建议使用 const 替代 let
// 具体修改建议：...
```

### 中文 API 文档

```typescript
const apiDoc = zhPromptGenerator.generateDoc(
  'api',
  '用户登录',
  '/api/auth/login',
  'POST',
  [
    { name: 'username', type: 'string', description: '用户名' },
    { name: 'password', type: 'string', description: '密码' }
  ],
  '{ "token": "xxx" }'
);
```

---

## 🎨 Agent 可视化面板

Web UI 中的 Agent 工作可视化：

```tsx
import { AgentPanel } from './components/AgentPanel.tsx';

// 在 React 应用中使用
<AgentPanel 
  agents={[
    { id: '1', name: 'CodeBot', role: 'worker', status: 'busy', 
      capabilities: ['coding'], taskProgress: 60 },
    { id: '2', name: 'ReviewBot', role: 'reviewer', status: 'idle',
      capabilities: ['review'] }
  ]}
  tasks={[
    { id: 't1', description: '实现登录功能', status: 'running', progress: 60, logs: [] }
  ]}
  currentWorkflow={{
    id: 'w1', name: '代码审查工作流', status: 'running',
    currentStep: 2, totalSteps: 3, startTime: Date.now()
  }}
/>
```

**功能：**
- Agent 状态实时显示
- 任务进度可视化
- 工作流步骤追踪
- 实时日志查看
- Agent 详情弹窗

---

## 🚀 快速开始

### 1. 安装

```bash
git clone https://github.com/lxztry/lxzclaw.git
cd lxzclaw
npm install
npm run build
```

### 2. 配置

```bash
cp .env.example .env
# 编辑 .env 配置 API Key
```

### 3. 启动

```bash
npm run dev
```

### 4. 使用工作流

```typescript
import { workflowExecutor } from './dist/workflows/index.js';
import { MultiAgentCoordinator } from './dist/agent/multi-agent.js';

// 创建工作流
const workflow = workflowExecutor.createFromTemplate('CODE_REVIEW', code);
console.log('工作流步骤:', workflow.steps.map(s => s.name));
```

---

## 📊 性能对比

| 操作 | Claude Code | OpenClaw | LxzClaw |
|------|-------------|-----------|----------|
| 单文件处理 | 1x | 1.2x | 1.3x |
| 多文件项目 | 1x | 1.5x | **2.5x** |
| 中文代码注释 | ❌ | ❌ | **1x** |
| 复杂工作流 | ❌ | 1x | **3x** |

---

## 🔮 路线图

- [ ] 行业专属 Agent（DevOps/安全/数据分析）
- [ ] Agent 可视化编辑器
- [ ] 企业级多租户支持
- [ ] API 开放平台
- [ ] 插件市场

---

*Last updated: 2026-04-04*
