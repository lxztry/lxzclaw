/**
 * LLM Provider factory and interface
 */

import { LLMConfig } from '../../config/index.js';
import { AnthropicProvider } from './anthropic.js';
import { MiniMaxProvider } from './minimax.js';

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

export interface LLMProvider {
  chat(messages: Array<{ role: string; content: string }>, tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>): Promise<LLMResponse>;
  chatStream(messages: Array<{ role: string; content: string }>, tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>): AsyncGenerator<string>;
}

export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'minimax':
    case 'openai':
    case 'openai-compatible':
      return new MiniMaxProvider(config);
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

export { AnthropicProvider } from './anthropic.js';
export { MiniMaxProvider } from './minimax.js';
