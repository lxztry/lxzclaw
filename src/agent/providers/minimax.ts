/**
 * MiniMax provider (OpenAI-compatible API)
 */

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

export class MiniMaxProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey ?? '';
    this.baseUrl = config.baseUrl ?? 'https://api.minimax.chat/v';
    this.model = config.model;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    _tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>
  ): Promise<LLMResponse> {
    logger.debug(`MiniMax chat: ${messages.length} messages`);

    try {
      const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MiniMax API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as {
        choices: Array<{
          message: {
            content?: string;
            tool_calls?: Array<{
              function: { name: string; arguments: string };
            }>;
          };
        }>;
        usage: { input_tokens: number; output_tokens: number };
      };

      const choice = data.choices[0];
      const message = choice.message;

      if (message.tool_calls) {
        return {
          content: message.content ?? '',
          toolCalls: message.tool_calls.map(tc => ({
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          })),
          usage: {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens,
          },
        };
      }

      return {
        content: message.content ?? '',
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error(`MiniMax error: ${error}`);
      throw error;
    }
  }

  async *chatStream(
    messages: Array<{ role: string; content: string }>,
    _tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>
  ): AsyncGenerator<string> {
    logger.debug(`MiniMax streaming chat`);

    const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`MiniMax stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }
  }
}
