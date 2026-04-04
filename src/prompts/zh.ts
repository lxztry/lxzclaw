/**
 * LxzClaw 中文 Prompt 优化
 * 针对中文场景优化的 Prompt 模板
 */

export interface ChinesePromptConfig {
  // 代码注释风格
  commentStyle: 'simple' | 'detailed' | 'javadoc';
  // 文档语言
  docLanguage: 'zh' | 'en' | 'mixed';
  // 术语翻译
  translateTerms: boolean;
}

export const DEFAULT_ZH_CONFIG: ChinesePromptConfig = {
  commentStyle: 'detailed',
  docLanguage: 'mixed',
  translateTerms: true,
};

// ============== 中文代码注释生成 ==============

export const COMMENT_PROMPTS = {
  /**
   * 函数注释生成
   */
  functionComment: (functionName: string, params: string[], returnType: string, description?: string): string => {
    return `请为以下函数生成中文注释：

函数名：${functionName}
参数：${params.join(', ')}
返回类型：${returnType}
${description ? `功能描述：${description}` : ''}

要求：
1. 使用简洁的中文注释
2. 说明函数功能和参数含义
3. 标注注意事项
4. 注释风格统一

请生成注释并标注在代码中。`;
  },

  /**
   * 类注释生成
   */
  classComment: (className: string, properties: string[], methods: string[], description?: string): string => {
    return `请为以下类生成中文注释：

类名：${className}
属性：${properties.join(', ')}
方法：${methods.join(', ')}
${description ? `类描述：${description}` : ''}

要求：
1. 详细的中文类文档
2. 说明类的用途和设计思路
3. 标注主要属性的含义
4. 说明重要方法的使用方式

请生成完整的类文档注释。`;
  },

  /**
   * 代码块注释生成
   */
  blockComment: (code: string, purpose: string): string => {
    return `请为以下代码块添加中文注释：

代码功能：${purpose}
代码内容：
\`\`\`
${code}
\`\`\`

要求：
1. 解释代码的逻辑和意图
2. 标注关键步骤
3. 说明特殊情况处理
4. 保持注释简洁清晰

请生成带注释的代码。`;
  }
};

// ============== 中文技术文档生成 ==============

export const DOC_PROMPTS = {
  /**
   * README 生成
   */
  readme: (projectName: string, features: string[], techStack: string[], usage?: string): string => {
    return `请为项目生成中文 README 文档：

项目名称：${projectName}
核心功能：
${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}
技术栈：
${techStack.map(t => `- ${t}`).join('\n')}
${usage ? `使用示例：\n${usage}` : ''}

要求：
1. 文档结构清晰
2. 包含安装、使用、示例
3. 添加徽章和截图占位
4. 适合中文开源项目

请生成完整的 README.md 内容。`;
  },

  /**
   * API 文档生成
   */
  apiDoc: (apiName: string, endpoint: string, method: string, params: any[], response: string): string => {
    return `请为以下 API 生成中文接口文档：

接口名称：${apiName}
端点：${endpoint}
请求方法：${method}
请求参数：
${params.map(p => `- ${p.name} (${p.type}): ${p.description || '无描述'}`).join('\n')}
响应示例：
\`\`\`json
${response}
\`\`\`

要求：
1. 完整的接口说明
2. 参数含义和类型
3. 请求示例
4. 响应说明
5. 错误码说明

请生成 API 文档。`;
  },

  /**
   * CHANGELOG 生成
   */
  changelog: (version: string, changes: { type: string; desc: string }[]): string => {
    return `请生成 CHANGELOG 条目：

版本号：${version}
更新内容：
${changes.map(c => `- **${c.type}**: ${c.desc}`).join('\n')}

要求：
1. 遵循 Keep a Changelog 规范
2. 使用中文描述
3. 分类清晰（新增/修改/修复/移除）

请生成 CHANGELOG.md 条目。`;
  }
};

// ============== 中文代码审查反馈 ==============

export const REVIEW_PROMPTS = {
  /**
   * 代码审查反馈
   */
  codeReview: (code: string, language: string): string => {
    return `请对以下代码进行中文代码审查：

编程语言：${language}
代码内容：
\`\`\`
${code}
\`\`\`

审查标准：
1. **代码规范**：命名、格式、风格
2. **逻辑正确**：边界条件、异常处理
3. **性能优化**：复杂度、资源占用
4. **安全漏洞**：注入、敏感信息
5. **可维护性**：耦合度、扩展性

请用中文给出：
1. 总体评价（10分制）
2. 问题列表（按严重程度）
3. 具体修改建议
4. 代码亮点

请生成中文审查报告。`;
  },

  /**
   * PR 审查摘要
   */
  prReview: (prTitle: string, prDesc: string, changedFiles: string[], additions: number, deletions: number): string => {
    return `请审查以下 Pull Request：

PR 标题：${prTitle}
PR 描述：${prDesc}
修改文件：${changedFiles.length} 个
代码变更：+${additions} -${deletions}

请给出中文审查摘要：
1. 变更概述
2. 主要改动点
3. 需要关注的文件
4. 建议和意见
5. 审查结论（Approve/Request Changes）

请生成简洁的 PR 审查摘要。`;
  }
};

// ============== 中文代码生成 ==============

export const CODE_PROMPTS = {
  /**
   * 中文需求转代码
   */
  requirementToCode: (requirement: string, language?: string): string => {
    return `请根据以下中文需求生成代码：

需求描述：
${requirement}
${language ? `编程语言：${language}` : ''}

要求：
1. 代码完整可运行
2. 添加中文注释
3. 包含必要的错误处理
4. 遵循最佳实践

请生成完整的代码实现。`;
  },

  /**
   * SQL 生成
   */
  generateSQL: (desc: string): string => {
    return `请根据描述生成 SQL：

需求描述：
${desc}

要求：
1. 生成完整的建表语句
2. 包含必要的索引
3. 添加注释说明
4. 考虑性能优化

请生成 SQL 语句。`;
  },

  /**
   * 正则表达式生成
   */
  generateRegex: (desc: string): string => {
    return `请根据描述生成正则表达式：

匹配需求：
${desc}

要求：
1. 给出正则表达式
2. 说明匹配规则
3. 给出匹配示例
4. 标注注意事项

请生成正则表达式及其说明。`;
  }
};

// ============== 中文问答模板 ==============

export const QA_PROMPTS = {
  /**
   * 技术问题解答
   */
  techAnswer: (question: string, context?: string): string => {
    return `请用中文解答以下技术问题：

问题：
${question}
${context ? `\n相关上下文：\n${context}` : ''}

要求：
1. 回答准确清晰
2. 包含示例代码（如适用）
3. 解释原理
4. 给出延伸阅读建议

请用中文详细解答。`;
  },

  /**
   * 概念解释
   */
  conceptExplain: (concept: string): string => {
    return `请用通俗易懂的中文解释以下概念：

概念名称：${concept}

要求：
1. 简单易懂的语言
2. 结合实际例子
3. 对比相关概念
4. 标注使用场景

请生成中文解释。`;
  }
};

// ============== 中文 Prompt 生成器 ==============

export class ChinesePromptGenerator {
  private config: ChinesePromptConfig;

  constructor(config: Partial<ChinesePromptConfig> = {}) {
    this.config = { ...DEFAULT_ZH_CONFIG, ...config };
  }

  /**
   * 生成中文代码注释
   */
  generateComment(type: 'function' | 'class' | 'block', ...args: any[]): string {
    switch (type) {
      case 'function':
        return COMMENT_PROMPTS.functionComment(args[0], args[1], args[2], args[3]);
      case 'class':
        return COMMENT_PROMPTS.classComment(args[0], args[1], args[2], args[3]);
      case 'block':
        return COMMENT_PROMPTS.blockComment(args[0], args[1]);
    }
  }

  /**
   * 生成中文文档
   */
  generateDoc(type: 'readme' | 'api' | 'changelog', ...args: any[]): string {
    switch (type) {
      case 'readme':
        return DOC_PROMPTS.readme(args[0], args[1], args[2], args[3]);
      case 'api':
        return DOC_PROMPTS.apiDoc(args[0], args[1], args[2], args[3], args[4]);
      case 'changelog':
        return DOC_PROMPTS.changelog(args[0], args[1]);
    }
  }

  /**
   * 生成中文审查
   */
  generateReview(type: 'code' | 'pr', ...args: any[]): string {
    switch (type) {
      case 'code':
        return REVIEW_PROMPTS.codeReview(args[0], args[1]);
      case 'pr':
        return REVIEW_PROMPTS.prReview(args[0], args[1], args[2], args[3], args[4]);
    }
  }

  /**
   * 生成中文代码
   */
  generateCode(type: 'requirement' | 'sql' | 'regex', desc: string, ...args: any[]): string {
    switch (type) {
      case 'requirement':
        return CODE_PROMPTS.requirementToCode(desc, args[0]);
      case 'sql':
        return CODE_PROMPTS.generateSQL(desc);
      case 'regex':
        return CODE_PROMPTS.generateRegex(desc);
    }
  }
}

export const zhPromptGenerator = new ChinesePromptGenerator();
