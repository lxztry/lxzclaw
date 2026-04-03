/**
 * LxzClaw - Main entry point
 */

import { loadConfig } from './config/index.js';
import { SessionManager } from './session/index.js';
import { AgentEngine } from './agent/index.js';
import { GatewayServer } from './gateway/index.js';
import { registerBuiltInTools } from './tools/index.js';
import { logger, setLogLevel, LogLevel } from './utils/logger.js';

export { Config } from './config/index.js';
export { SessionManager } from './session/index.js';
export { AgentEngine } from './agent/index.js';
export { GatewayServer } from './gateway/index.js';
export { toolRegistry } from './tools/index.js';
export { observability } from './observability/index.js';

export interface LxzClawOptions {
  config?: string;
  cli?: boolean;
  chat?: string;
  gateway?: boolean;
  port?: number;
  sessionId?: string;
}

export async function createLxzClaw(options: LxzClawOptions = {}): Promise<{
  agent: AgentEngine;
  sessionManager: SessionManager;
  gateway?: GatewayServer;
}> {
  const config = await loadConfig();

  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  };
  setLogLevel(levelMap[config.logging.level] ?? LogLevel.INFO);

  const sessionManager = new SessionManager();
  await sessionManager.init();

  const agent = new AgentEngine(config, sessionManager);
  registerBuiltInTools();
  await agent.init();

  let gateway: GatewayServer | undefined;
  if (options.gateway || options.cli === false) {
    gateway = new GatewayServer(config, agent, sessionManager);
    await gateway.start();
  }

  logger.info('LxzClaw initialized');

  return { agent, sessionManager, gateway };
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] ?? 'cli';
  const chatMessage = mode === 'chat' ? args.slice(1).join(' ') : null;

  if (chatMessage) {
    const { agent, sessionManager } = await createLxzClaw();
    const session = sessionManager.create({ type: 'chat' });
    const response = await agent.processMessage(session.id, chatMessage);
    console.log(response);
    await agent.shutdown();
    return;
  }

  if (mode === 'gateway') {
    const { agent } = await createLxzClaw({ gateway: true });
    
    const shutdown = async () => {
      logger.info('Shutting down...');
      await agent.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return;
  }

  const { agent, sessionManager } = await createLxzClaw();
  
  const { TUI } = await import('./cli/tui.js');
  const session = sessionManager.create({ type: 'cli' });
  const tui = new TUI(agent, sessionManager, session.id);
  await tui.start();

  const shutdown = async () => {
    logger.info('Shutting down...');
    await agent.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
