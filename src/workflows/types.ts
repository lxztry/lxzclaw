/**
 * LxzClaw Workflow Templates
 * 预设工作流模板 - 开箱即用的 Agent 协作流程
 */

import { logger } from '../utils/logger.js';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentRole: 'supervisor' | 'coder' | 'reviewer' | 'researcher';
  agentName: string;
  prompt: string;
  expectedOutput: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  parallel?: boolean;  // 是否并行执行
}

export interface WorkflowResult {
  workflowId: string;
  status: 'success' | 'failed' | 'partial';
  stepResults: Map<string, string>;
  totalTime: number;
}

// ============== 预设工作流模板 ==============

export const WorkflowTemplates = {
  
  /**
   * 代码审查工作流
   * Coder → Reviewer → Supervisor
   */
  CODE_REVIEW: (code: string, language?: string): Workflow => ({
    id: 'code-review',
    name: '代码审查工作流',
    description: '完整的代码审查流程：编写 → 审查 → 综合建议',
    parallel: false,
    steps: [
      {
        id: 'coder',
        name: '代码编写',
        description: '根据需求编写代码',
        agentRole: 'coder',
        agentName: 'CodeBot',
        prompt: `请根据以下需求编写代码：
        
${code}

${language ? `语言：${language}` : ''}

要求：
1. 代码规范，遵循最佳实践
2. 添加必要的注释
3. 考虑性能和安全性`,
        expectedOutput: '完整的代码实现'
      },
      {
        id: 'reviewer',
        name: '代码审查',
        description: '审查代码问题',
        agentRole: 'reviewer',
        agentName: 'ReviewBot',
        prompt: `请审查以下代码，找出潜在问题：

${code}

审查维度：
1. 代码规范和风格
2. 潜在 bug 和错误
3. 性能问题
4. 安全漏洞
5. 可维护性

请给出具体的修改建议。`,
        expectedOutput: '审查报告和修改建议'
      },
      {
        id: 'supervisor',
        name: '综合决策',
        description: '综合评审结果给出最终方案',
        agentRole: 'supervisor',
        agentName: 'SuperVisor',
        prompt: `你是代码质量主管，请综合以下评审结果给出最终方案：

评审发现的问题：
[需要由上一步提供]

任务要求：
${code}

请给出：
1. 最终采纳的代码
2. 需要修改的地方
3. 后续改进建议`,
        expectedOutput: '最终代码方案'
      }
    ]
  }),

  /**
   * DevOps 自动化工作流
   * Build → Test → Deploy
   */
  DEVOPS: (projectPath: string, env?: string): Workflow => ({
    id: 'devops',
    name: 'DevOps 自动化工作流',
    description: '自动化构建、测试、部署流程',
    parallel: true,  // Build 和 Test 可以并行
    steps: [
      {
        id: 'build',
        name: '构建',
        description: '编译项目代码',
        agentRole: 'coder',
        agentName: 'BuildBot',
        prompt: `请在 ${projectPath} 目录下执行构建：

1. 检查项目依赖
2. 执行构建命令
3. 处理构建错误

环境：${env || 'production'}

构建完成后报告结果。`,
        expectedOutput: '构建状态和产物'
      },
      {
        id: 'test',
        name: '测试',
        description: '运行测试用例',
        agentRole: 'reviewer',
        agentName: 'TestBot',
        prompt: `请在 ${projectPath} 目录下执行测试：

1. 运行单元测试
2. 运行集成测试
3. 生成测试覆盖率报告

测试环境：${env || 'production'}

请报告测试结果和覆盖率。`,
        expectedOutput: '测试结果和覆盖率'
      },
      {
        id: 'deploy',
        name: '部署',
        description: '部署到目标环境',
        agentRole: 'supervisor',
        agentName: 'DeployBot',
        prompt: `基于构建和测试结果，执行部署：

项目路径：${projectPath}
环境：${env || 'production'}

部署步骤：
1. 验证构建产物
2. 执行部署脚本
3. 验证部署结果
4. 发送部署通知

请报告部署状态。`,
        expectedOutput: '部署状态和访问地址'
      }
    ]
  }),

  /**
   * 文档生成工作流
   * Research → Write → Review
   */
  DOC_GEN: (topic: string, docType?: string): Workflow => ({
    id: 'doc-gen',
    name: '文档生成工作流',
    description: '自动生成技术文档',
    parallel: false,
    steps: [
      {
        id: 'research',
        name: '信息收集',
        description: '收集相关资料',
        agentRole: 'researcher',
        agentName: 'ResearchBot',
        prompt: `请收集关于 "${topic}" 的相关资料：

1. 查找官方文档
2. 收集最佳实践
3. 整理相关示例
4. 列出参考资料

文档类型：${docType || '技术文档'}

请整理收集到的信息。`,
        expectedOutput: '资料整理报告'
      },
      {
        id: 'write',
        name: '文档编写',
        description: '生成文档内容',
        agentRole: 'coder',
        agentName: 'DocWriter',
        prompt: `基于收集的资料，请为 "${topic}" 生成文档：

文档类型：${docType || '技术文档'}

要求：
1. 结构清晰，层次分明
2. 包含代码示例
3. 包含使用说明
4. 中英文混排时适当

请生成完整的文档内容。`,
        expectedOutput: '完整文档'
      },
      {
        id: 'review',
        name: '文档审核',
        description: '审核文档质量',
        agentRole: 'reviewer',
        agentName: 'DocReviewer',
        prompt: `请审核以下文档的质量：

[文档内容由上一步提供]

审核维度：
1. 内容准确性
2. 结构合理性
3. 表达清晰度
4. 格式规范性

请给出修改建议。`,
        expectedOutput: '审核报告'
      }
    ]
  }),

  /**
   * Bug 修复工作流
   * Reproduce → Analyze → Fix → Test
   */
  BUG_FIX: (bugReport: string): Workflow => ({
    id: 'bug-fix',
    name: 'Bug 修复工作流',
    description: '自动化 Bug 定位和修复',
    parallel: false,
    steps: [
      {
        id: 'reproduce',
        name: '复现问题',
        description: '尝试复现 Bug',
        agentRole: 'researcher',
        agentName: 'BugHunter',
        prompt: `请尝试复现以下 Bug：

${bugReport}

步骤：
1. 分析 Bug 描述
2. 搭建复现环境
3. 执行复现步骤
4. 记录复现结果

请详细报告复现情况。`,
        expectedOutput: '复现报告'
      },
      {
        id: 'analyze',
        name: '问题分析',
        description: '定位问题根因',
        agentRole: 'coder',
        agentName: 'RootCauseBot',
        prompt: `请分析以下 Bug 的根本原因：

${bugReport}

分析维度：
1. 代码层面分析
2. 调用链路追踪
3. 可能的触发条件
4. 影响范围评估

请给出根因分析报告。`,
        expectedOutput: '根因分析'
      },
      {
        id: 'fix',
        name: '修复代码',
        description: '编写修复代码',
        agentRole: 'coder',
        agentName: 'FixBot',
        prompt: `请根据分析结果修复 Bug：

Bug 信息：${bugReport}

修复要求：
1. 最小改动原则
2. 不引入新问题
3. 添加回归测试
4. 更新相关文档

请提供修复代码和说明。`,
        expectedOutput: '修复代码'
      },
      {
        id: 'test',
        name: '验证修复',
        description: '验证 Bug 已修复',
        agentRole: 'reviewer',
        agentName: 'VerifyBot',
        prompt: `请验证 Bug 修复：

Bug 信息：${bugReport}

验证步骤：
1. 重新执行复现步骤
2. 运行相关测试
3. 检查影响范围
4. 确认修复有效

请给出验证结论。`,
        expectedOutput: '验证报告'
      }
    ]
  }),

  /**
   * 新功能开发工作流
   * Spec → Implement → Review → Test → Deploy
   */
  FEATURE_DEV: (requirement: string): Workflow => ({
    id: 'feature-dev',
    name: '新功能开发工作流',
    description: '从需求到部署的完整流程',
    parallel: false,
    steps: [
      {
        id: 'spec',
        name: '需求分析',
        description: '编写技术规格',
        agentRole: 'supervisor',
        agentName: 'SpecBot',
        prompt: `请分析以下需求并编写技术规格：

${requirement}

规格要求：
1. 明确功能范围
2. 定义接口设计
3. 规划数据结构
4. 估算工作量

请输出完整的技术规格文档。`,
        expectedOutput: '技术规格文档'
      },
      {
        id: 'implement',
        name: '代码实现',
        description: '实现功能代码',
        agentRole: 'coder',
        agentName: 'CodeBot',
        prompt: `请根据规格实现功能：

[规格由上一步提供]

实现要求：
1. 遵循代码规范
2. 添加单元测试
3. 编写注释文档
4. 考虑可扩展性

请提供完整的代码实现。`,
        expectedOutput: '代码实现'
      },
      {
        id: 'review',
        name: '代码审查',
        description: '审查代码质量',
        agentRole: 'reviewer',
        agentName: 'ReviewBot',
        prompt: `请审查新功能代码：

[代码由上一步提供]

审查要求：
1. 代码质量
2. 安全性检查
3. 性能评估
4. 最佳实践

请给出审查意见。`,
        expectedOutput: '审查报告'
      },
      {
        id: 'test',
        name: '测试验证',
        description: '全面测试验证',
        agentRole: 'reviewer',
        agentName: 'TestBot',
        prompt: `请对新功能进行全面测试：

[代码由实现步骤提供]

测试要求：
1. 单元测试覆盖
2. 集成测试
3. 边界条件测试
4. 性能测试

请提供测试报告。`,
        expectedOutput: '测试报告'
      },
      {
        id: 'deploy',
        name: '部署发布',
        description: '部署到生产环境',
        agentRole: 'supervisor',
        agentName: 'DeployBot',
        prompt: `请执行新功能部署：

功能信息：${requirement}

部署步骤：
1. 代码合并
2. 执行部署
3. 验证功能
4. 监控稳定性

请报告部署结果。`,
        expectedOutput: '部署报告'
      }
    ]
  })
};

// ============== 工作流执行器 ==============

export class WorkflowExecutor {
  private workflows: Map<string, Workflow> = new Map();

  registerWorkflow(id: string, workflow: Workflow): void {
    this.workflows.set(id, workflow);
    logger.info(`Registered workflow: ${id} - ${workflow.name}`);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 从模板创建工作流
   */
  createFromTemplate(templateName: string, ...args: any[]): Workflow | undefined {
    const templates = WorkflowTemplates as any;
    if (typeof templates[templateName] === 'function') {
      return templates[templateName](...args);
    }
    return undefined;
  }

  /**
   * 列出所有可用模板
   */
  listTemplates(): string[] {
    return Object.keys(WorkflowTemplates).filter(k => typeof (WorkflowTemplates as any)[k] === 'function');
  }
}

export const workflowExecutor = new WorkflowExecutor();
