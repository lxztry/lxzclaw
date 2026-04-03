/**
 * Configuration schema and validation using Zod
 */

import { z } from 'zod';
import os from 'os';
import path from 'path';

// LLM Provider schema
export const LLMProviderSchema = z.enum(['anthropic', 'minimax', 'openai', 'openai-compatible', 'openrouter', 'kimi', 'glm']);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

// Gateway config
export const GatewayConfigSchema = z.object({
  port: z.number().min(1024).max(65535),
  host: z.string(),
  authToken: z.string().optional(),
  corsOrigins: z.array(z.string()),
});
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;

// LLM config
export const LLMConfigSchema = z.object({
  provider: LLMProviderSchema,
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string(),
  maxTokens: z.number(),
  temperature: z.number(),
  timeout: z.number(),
});
export type LLMConfig = z.infer<typeof LLMConfigSchema>;

// Tool config
export const ToolConfigSchema = z.object({
  enabled: z.boolean(),
  timeout: z.number(),
  allowedPaths: z.array(z.string()),
  blockedPaths: z.array(z.string()),
  bash: z.object({
    enabled: z.boolean(),
    timeout: z.number(),
    shell: z.string(),
  }),
});
export type ToolConfig = z.infer<typeof ToolConfigSchema>;

// Session config
export const SessionConfigSchema = z.object({
  type: z.enum(['cli', 'chat', 'task']),
  workspace: z.string().optional(),
  autoSave: z.boolean(),
  maxHistory: z.number(),
});
export type SessionConfig = z.infer<typeof SessionConfigSchema>;

// Channel config
export const ChannelConfigSchema = z.object({
  type: z.string(),
  enabled: z.boolean(),
  webhookPath: z.string().optional(),
  authToken: z.string().optional(),
});
export type ChannelConfig = z.infer<typeof ChannelConfigSchema>;

// Main config schema
export const ConfigSchema = z.object({
  gateway: GatewayConfigSchema,
  llm: LLMConfigSchema,
  tools: ToolConfigSchema,
  session: SessionConfigSchema,
  channels: z.record(z.string(), ChannelConfigSchema),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    file: z.string().optional(),
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

// Defaults
export const defaultConfig: Config = {
  gateway: {
    port: 18789,
    host: '127.0.0.1',
    corsOrigins: ['http://localhost:3000'],
  },
  llm: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 1,
    timeout: 60000,
  },
  tools: {
    enabled: true,
    timeout: 30000,
    allowedPaths: [],
    blockedPaths: [],
    bash: {
      enabled: true,
      timeout: 30000,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    },
  },
  session: {
    type: 'chat',
    autoSave: true,
    maxHistory: 100,
  },
  channels: {},
  logging: {
    level: 'info',
  },
};

// Resolve paths with home directory expansion
export function resolvePath(input: string): string {
  if (input.startsWith('~')) {
    return path.join(os.homedir(), input.slice(1));
  }
  return input;
}

export function resolveConfigPaths(config: Config): Config {
  return config;
}
