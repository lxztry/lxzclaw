/**
 * Configuration loader - loads from file, env, and defaults
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Config, ConfigSchema, defaultConfig, resolvePath } from './schema.js';
import { logger } from '../utils/logger.js';

// Load dotenv synchronously at startup - try multiple locations
function loadDotenvSync(): void {
  const locations = [
    path.join(process.cwd(), '.env'),
    path.join(os.homedir(), '.env'),
    'D:\\NodeJS\\node_global\\node_modules\\lxzclaw\\.env',
    'D:\\NodeJS\\node_modules\\lxzclaw\\.env',
  ];
  
  for (const loc of locations) {
    try {
      const result = dotenv.config({ path: loc });
      if (result.parsed && Object.keys(result.parsed).length > 0) {
        logger.debug(`Loaded .env from: ${loc}`);
        break;
      }
    } catch {
      // Continue
    }
  }
}

loadDotenvSync();

const CONFIG_FILE_NAME = 'lxzclaw.json';
const CONFIG_DIR_NAME = '.lxzclaw';

async function findConfigPath(): Promise<string | null> {
  const envPath = process.env.LXZ_CONFIG_PATH;
  if (envPath) return resolvePath(envPath);

  const locations = [
    path.join(process.cwd(), CONFIG_FILE_NAME),
    path.join(os.homedir(), CONFIG_DIR_NAME, CONFIG_FILE_NAME),
  ];

  for (const loc of locations) {
    try {
      await fs.access(loc);
      return loc;
    } catch {
      // File doesn't exist, continue
    }
  }

  return null;
}

export async function loadConfig(): Promise<Config> {
  let fileConfig: Partial<Config> = {};
  const configPath = await findConfigPath();

  if (configPath) {
    logger.debug(`Loading config from: ${configPath}`);
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      fileConfig = parsed as Partial<Config>;
    } catch (error) {
      logger.warn(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    logger.debug('No config file found, using defaults');
  }

  // Build config from defaults, file, and env
  const result: Config = { ...defaultConfig };

  // Apply file config
  if (fileConfig.gateway) {
    result.gateway = { ...defaultConfig.gateway, ...fileConfig.gateway };
  }
  if (fileConfig.llm) {
    result.llm = { ...defaultConfig.llm, ...fileConfig.llm };
  }
  if (fileConfig.tools) {
    result.tools = { ...defaultConfig.tools, ...fileConfig.tools };
  }
  if (fileConfig.session) {
    result.session = { ...defaultConfig.session, ...fileConfig.session };
  }
  if (fileConfig.channels) {
    result.channels = fileConfig.channels;
  }
  if (fileConfig.logging) {
    result.logging = { ...defaultConfig.logging, ...fileConfig.logging };
  }

  // Apply env config
  if (process.env.LXZ_GATEWAY_PORT) {
    result.gateway.port = parseInt(process.env.LXZ_GATEWAY_PORT, 10);
  }
  if (process.env.LXZ_GATEWAY_HOST) {
    result.gateway.host = process.env.LXZ_GATEWAY_HOST;
  }
  if (process.env.LXZ_AUTH_TOKEN) {
    result.gateway.authToken = process.env.LXZ_AUTH_TOKEN;
  }
  if (process.env.LXZ_LLM_PROVIDER) {
    result.llm.provider = process.env.LXZ_LLM_PROVIDER as Config['llm']['provider'];
  }
  if (process.env.LXZ_ANTHROPIC_API_KEY) {
    result.llm.apiKey = process.env.LXZ_ANTHROPIC_API_KEY;
  }
  if (process.env.LXZ_ANTHROPIC_BASE_URL) {
    result.llm.baseUrl = process.env.LXZ_ANTHROPIC_BASE_URL;
  }
  if (process.env.LXZ_MINIMAX_API_KEY) {
    result.llm.apiKey = process.env.LXZ_MINIMAX_API_KEY;
  }
  if (process.env.LXZ_MINIMAX_BASE_URL) {
    result.llm.baseUrl = process.env.LXZ_MINIMAX_BASE_URL;
  }
  if (process.env.LXZ_OPENROUTER_API_KEY) {
    result.llm.apiKey = process.env.LXZ_OPENROUTER_API_KEY;
  }
  if (process.env.LXZ_OPENROUTER_BASE_URL) {
    result.llm.baseUrl = process.env.LXZ_OPENROUTER_BASE_URL;
  }
  if (process.env.LXZ_GLM_API_KEY) {
    result.llm.apiKey = process.env.LXZ_GLM_API_KEY;
  }
  if (process.env.LXZ_GLM_BASE_URL) {
    result.llm.baseUrl = process.env.LXZ_GLM_BASE_URL;
  }
  if (process.env.LXZ_OPENAI_API_KEY) {
    result.llm.apiKey = process.env.LXZ_OPENAI_API_KEY;
  }
  if (process.env.LXZ_MODEL) {
    result.llm.model = process.env.LXZ_MODEL;
  }
  if (process.env.LXZ_LOG_LEVEL) {
    result.logging.level = process.env.LXZ_LOG_LEVEL as Config['logging']['level'];
  }

  // Validate
  try {
    return ConfigSchema.parse(result);
  } catch (error) {
    logger.warn(`Config validation failed, using defaults: ${error}`);
    return defaultConfig;
  }
}

export async function saveConfig(config: Config, filePath?: string): Promise<void> {
  const savePath = filePath ?? path.join(os.homedir(), CONFIG_DIR_NAME, CONFIG_FILE_NAME);
  
  await fs.mkdir(path.dirname(savePath), { recursive: true });
  
  await fs.writeFile(savePath, JSON.stringify(config, null, 2), 'utf-8');
  logger.info(`Config saved to: ${savePath}`);
}
