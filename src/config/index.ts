import type { 
  Config, 
  LLMConfig, 
  LLMProvider, 
  ToolConfig,
  SessionConfig,
  GatewayConfig,
  ChannelConfig
} from './schema.js';

export { 
  ConfigSchema,
  LLMConfigSchema,
  LLMProviderSchema,
  ToolConfigSchema,
  SessionConfigSchema,
  ChannelConfigSchema,
  defaultConfig 
} from './schema.js';
export { loadConfig, saveConfig } from './loader.js';

export type { 
  Config, 
  LLMConfig, 
  LLMProvider, 
  ToolConfig,
  SessionConfig,
  GatewayConfig,
  ChannelConfig
};
