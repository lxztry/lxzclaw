/**
 * Smart Agent - 智能Agent能力
 * 
 * 包含：
 * - 反思机制
 * - 自动重试
 * - 任务规划
 */

import { Config } from '../config/index.js';
import { SessionManager } from '../session/index.js';
import { toolRegistry, ToolResult } from '../tools/index.js';
import { createLLMProvider, LLMProvider } from './providers/index.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  onRetry?: (attempt: number, error: string) => void;
}

export interface ReflectionConfig {
  enabled: boolean;
  maxReflections: number;
}

export class SmartAgent extends EventEmitter {
  private llm: LLMProvider;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    backoffMs: 1000,
  };
  private reflectionConfig: ReflectionConfig = {
    enabled: true,
    maxReflections: 3,
  };

  constructor(config: Config, _sessionManager: SessionManager, options?: {
    retry?: Partial<RetryConfig>;
    reflection?: Partial<ReflectionConfig>;
  }) {
    super();
    this.llm = createLLMProvider(config.llm);
    
    if (options?.retry) {
      this.retryConfig = { ...this.retryConfig, ...options.retry };
    }
    if (options?.reflection) {
      this.reflectionConfig = { ...this.reflectionConfig, ...options.reflection };
    }
  }

  /**
   * 执行工具并自动重试
   */
  async executeWithRetry(
    toolName: string,
    input: Record<string, unknown>,
    context: { sessionId: string; workspace?: string }
  ): Promise<ToolResult> {
    let lastError: string = '';
    let attempt = 0;

    while (attempt < this.retryConfig.maxRetries) {
      attempt++;
      logger.debug(`Tool execution attempt ${attempt}/${this.retryConfig.maxRetries}: ${toolName}`);

      const result = await toolRegistry.execute(toolName, input, context);
      
      if (result.success) {
        return result;
      }

      lastError = result.error ?? 'Unknown error';
      
      if (attempt < this.retryConfig.maxRetries) {
        this.retryConfig.onRetry?.(attempt, lastError);
        logger.info(`Tool failed, retrying in ${this.retryConfig.backoffMs}ms: ${lastError}`);
        await this.sleep(this.retryConfig.backoffMs * attempt);
      }
    }

    return {
      success: false,
      error: `Failed after ${this.retryConfig.maxRetries} attempts: ${lastError}`,
    };
  }

  /**
   * 反思工具执行失败的原因
   */
  async reflectOnFailure(
    toolName: string,
    toolInput: Record<string, unknown>,
    error: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const reflectionPrompt = `你正在分析一个工具执行失败的原因。请分析以下信息：

工具名称: ${toolName}
工具输入: ${JSON.stringify(toolInput, null, 2)}
错误信息: ${error}

请提供：
1. 可能失败的原因
2. 改进建议
3. 是否有其他方式可以实现相同目标

请用中文回复，简洁明了。`;

    const reflectionMessages = [
      ...messages,
      { role: 'user', content: reflectionPrompt },
    ];

    try {
      const response = await this.llm.chat(reflectionMessages, []);
      logger.info(`Reflection for ${toolName}: ${response.content.substring(0, 200)}`);
      return response.content;
    } catch (err) {
      logger.warn(`Reflection failed: ${err}`);
      return '';
    }
  }

  /**
   * 规划任务 - 将复杂任务分解为步骤
   */
  async planTask(
    task: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<Array<{ action: string; target: string; reason: string }>> {
    const planningPrompt = `你是一个任务规划助手。请将以下任务分解为具体的执行步骤：

任务: ${task}

请以JSON数组格式返回，每个步骤包含：
- action: 执行动作 (read/write/edit/bash/search等)
- target: 目标文件或路径
- reason: 执行原因

只返回JSON数组，不要其他内容。`;

    const planningMessages = [
      ...messages,
      { role: 'user', content: planningPrompt },
    ];

    try {
      const response = await this.llm.chat(planningMessages, []);
      const plan = JSON.parse(response.content);
      logger.info(`Task plan: ${plan.length} steps`);
      return plan;
    } catch (err) {
      logger.error(`Planning failed: ${err}`);
      return [];
    }
  }

  /**
   * 检查任务是否需要规划
   */
  shouldPlanTask(task: string): boolean {
    const keywords = ['多个文件', '重构', '实现', '创建项目', '批量', '迁移', '整合'];
    return keywords.some(kw => task.includes(kw));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}