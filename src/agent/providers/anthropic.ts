/**
 * Anthropic Claude provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { LLMConfig } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    input: Record<string, unknown>;
  }>;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class AnthropicProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.model = config.model;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>
  ): Promise<LLMResponse> {
    logger.debug(`Anthropic chat: ${messages.length} messages, ${tools?.length ?? 0} tools`);

    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const request: Anthropic.Messages.MessageCreateParams = {
      model: this.model,
      max_tokens: 4096,
      system: systemMsg?.content ?? '',
      messages: conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    };

    if (tools && tools.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.tools = tools.map(t => ({
        name: t.name,
        description: t.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input_schema: t.input_schema as any,
      }));
      request.tool_choice = { type: 'auto' as const };
    }

    try {
      const response = await this.client.messages.create(request);
      const message = response as Anthropic.Messages.Message;

      const content = message.content[0];
      
      if (content.type === 'text') {
        return {
          content: content.text,
          usage: {
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens,
          },
        };
      }

      if (content.type === 'tool_use') {
        return {
          content: '',
          toolCalls: [{
            name: content.name,
            input: content.input as Record<string, unknown>,
          }],
          usage: {
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens,
          },
        };
      }

      return { content: '' };
    } catch (error) {
      logger.error(`Anthropic error: ${error}`);
      throw error;
    }
  }

  async *chatStream(
    messages: Array<{ role: string; content: string }>,
    _tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>
  ): AsyncGenerator<string> {
    logger.debug(`Anthropic streaming chat`);

    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: systemMsg?.content ?? '',
      messages: conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    }
  }
}
