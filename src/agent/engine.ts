/**
 * Agent Engine - Main agent loop with tool execution
 */

import { EventEmitter } from 'events';
import { Config } from '../config/index.js';
import { SessionManager } from '../session/index.js';
import { toolRegistry, ToolResult } from '../tools/index.js';
import { createLLMProvider, LLMProvider, LLMResponse } from './providers/index.js';
import { logger } from '../utils/logger.js';

export interface AgentEvents {
  'message': (sessionId: string, message: { role: string; content: string }) => void;
  'tool_call': (sessionId: string, tool: { name: string; input: Record<string, unknown> }) => void;
  'tool_result': (sessionId: string, result: ToolResult) => void;
  'error': (sessionId: string, error: Error) => void;
}

export class AgentEngine extends EventEmitter {
  private sessionManager: SessionManager;
  private llm: LLMProvider;
  private maxIterations: number = 10;

  constructor(config: Config, sessionManager: SessionManager) {
    super();
    this.sessionManager = sessionManager;
    this.llm = createLLMProvider(config.llm);
  }

  async processMessage(
    sessionId: string,
    content: string,
    options: {
      systemPrompt?: string;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<string> {
    logger.debug(`Processing message for session ${sessionId}`);

    const session = await this.sessionManager.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Build messages for LLM
    const messages: Array<{ role: string; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    // Add conversation history
    const history = this.sessionManager.getHistory(sessionId, 50);
    logger.debug(`History: ${history.length} messages`);
    for (const msg of history) {
      const msgContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      messages.push({
        role: msg.role,
        content: msgContent,
      });
    }

    // Add current user message
    messages.push({ role: 'user', content });
    logger.debug(`LLM messages count: ${messages.length}`);

    // Get available tools
    const tools = toolRegistry.getToolSchemas();

    // Main agent loop
    let finalResponse = '';

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      logger.debug(`Agent iteration ${iteration + 1}`);

      if (options.stream && iteration === 0) {
        // Stream response
        let fullContent = '';
        for await (const chunk of this.llm.chatStream(messages, tools)) {
          fullContent += chunk;
          options.onChunk?.(chunk);
        }
        finalResponse = fullContent;
        
        this.sessionManager.addMessage(sessionId, {
          role: 'assistant',
          content: fullContent,
        });

        this.emit('message', sessionId, { role: 'assistant', content: fullContent });
        break;
      } else {
        // Non-streaming
        const response: LLMResponse = await this.llm.chat(messages, tools);

        if (response.content) {
          finalResponse = response.content;
          
          this.sessionManager.addMessage(sessionId, {
            role: 'assistant',
            content: response.content,
          });

          this.emit('message', sessionId, { role: 'assistant', content: response.content });
        }

        // Handle tool calls
        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const toolCall of response.toolCalls) {
            logger.debug(`Tool call: ${toolCall.name}`);
            this.emit('tool_call', sessionId, toolCall);

            // Execute tool
            const toolResult = await toolRegistry.execute(toolCall.name, toolCall.input, {
              sessionId,
              workspace: session.workspace,
            });

            logger.debug(`Tool result: ${toolResult.success ? 'success' : 'error'}`);
            this.emit('tool_result', sessionId, toolResult);

            // Add tool result as a message
            const toolResultContent = toolResult.success
              ? JSON.stringify(toolResult.output)
              : `Error: ${toolResult.error}`;

            this.sessionManager.addMessage(sessionId, {
              role: 'tool',
              content: toolResultContent,
            });

            messages.push({
              role: 'user',
              content: `[Tool: ${toolCall.name}]\nResult: ${toolResultContent}`,
            });
          }

          // Continue loop to get final response after tool execution
          continue;
        }

        // No tool calls, we're done
        break;
      }
    }

    // Save session
    await this.sessionManager.save(sessionId);

    return finalResponse;
  }

  async init(): Promise<void> {
    logger.info('Agent engine initialized');
  }

  async shutdown(): Promise<void> {
    await this.sessionManager.shutdown();
    logger.info('Agent engine shut down');
  }
}
