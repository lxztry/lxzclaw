/**
 * CLI commands
 */

import { Command } from 'commander';
import { loadConfig } from '../config/index.js';
import { SessionManager } from '../session/index.js';
import { AgentEngine } from '../agent/index.js';
import { GatewayServer } from '../gateway/index.js';
import { registerBuiltInTools } from '../tools/index.js';
import { TUI } from './tui.js';
import { logger, setLogLevel, LogLevel } from '../utils/logger.js';

export async function runCLI(options: { chat?: string; session?: string } = {}): Promise<void> {
  // Load config
  const config = await loadConfig();
  
  // Set log level
  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  };
  setLogLevel(levelMap[config.logging.level] ?? LogLevel.INFO);

  // Initialize components
  const sessionManager = new SessionManager();
  await sessionManager.init();

  const agent = new AgentEngine(config, sessionManager);
  registerBuiltInTools();
  await agent.init();

  // If single chat message, process and return
  if (options.chat) {
    const session = sessionManager.create({ type: 'chat' });
    const response = await agent.processMessage(session.id, options.chat);
    console.log(response);
    await agent.shutdown();
    return;
  }

  // Start interactive CLI
  const sessionId = options.session ?? sessionManager.create({ type: 'cli' }).id;
  const tui = new TUI(agent, sessionManager, sessionId);
  await tui.start();
}

export async function runGateway(): Promise<void> {
  const config = await loadConfig();

  // Set log level
  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  };
  setLogLevel(levelMap[config.logging.level] ?? LogLevel.INFO);

  // Initialize components
  const sessionManager = new SessionManager();
  await sessionManager.init();

  const agent = new AgentEngine(config, sessionManager);
  registerBuiltInTools();
  await agent.init();

  // Start gateway
  const gateway = new GatewayServer(config, agent, sessionManager);
  await gateway.start();

  // Handle shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await gateway.stop();
    await agent.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export function createCLI(): Command {
  const program = new Command();

  program
    .name('lxzclaw')
    .description('LxzClaw - AI Agent Gateway & Coding Assistant')
    .version('0.1.0');

  program
    .command('gateway')
    .description('Start the gateway server')
    .action(runGateway);

  program
    .command('chat')
    .description('Send a single chat message')
    .argument('<message>', 'Message to send')
    .option('-s, --session <id>', 'Session ID to use')
    .action(async (message, options) => {
      await runCLI({ chat: message, session: options.session });
    });

  return program;
}
