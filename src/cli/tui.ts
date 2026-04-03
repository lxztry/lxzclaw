/**
 * Terminal UI for interactive CLI mode
 */

import readline from 'readline';
import { AgentEngine } from '../agent/index.js';
import { SessionManager } from '../session/index.js';
import * as ansi from './ansi.js';

export class TUI {
  private agent: AgentEngine;
  private sessionManager: SessionManager;
  private sessionId: string;
  private rl: readline.Interface;
  private history: string[] = [];
  private isStreaming: boolean = false;

  constructor(agent: AgentEngine, sessionManager: SessionManager, sessionId: string) {
    this.agent = agent;
    this.sessionManager = sessionManager;
    this.sessionId = sessionId;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ansi.prompt(''),
      history: [],
      completer: this.completer.bind(this),
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.rl.on('line', this.handleLine.bind(this));
    this.rl.on('close', this.handleClose.bind(this));
    this.rl.on('SIGINT', this.handleSIGINT.bind(this));
  }

  private completer(line: string): [string[], string] {
    const commands = ['exit', 'quit', 'help', 'clear', 'history', 'session', 'tools'];
    const hits = commands.filter(c => c.startsWith(line.toLowerCase()));
    return [hits.length ? hits : [], line];
  }

  private async handleLine(input: string): Promise<void> {
    const trimmed = input.trim();

    if (!trimmed) {
      this.rl.prompt();
      return;
    }

    this.history.push(trimmed);

    // Check session exists
    const session = await this.sessionManager.get(this.sessionId);
    if (!session) {
      process.stdout.write(`\n${ansi.error('Error: Session not found, creating new session...')}\n`);
      const newSession = this.sessionManager.create({ type: 'cli' });
      this.sessionId = newSession.id;
      process.stdout.write(`${ansi.success('New session created: ' + this.sessionId)}\n`);
    }

    if (await this.handleCommand(trimmed)) {
      this.rl.prompt();
      return;
    }

    this.isStreaming = true;
    process.stdout.write('\n');

    try {
      process.stdout.write(`${ansi.tool('Thinking...')}\n`);
      const response = await this.agent.processMessage(this.sessionId, trimmed);
      process.stdout.write('\n' + response + '\n\n');
    } catch (err) {
      process.stdout.write(`\n${ansi.error('Error: ' + (err instanceof Error ? err.message : String(err)))}\n`);
    }

    this.isStreaming = false;
    this.rl.prompt();
  }

  private async handleCommand(input: string): Promise<boolean> {
    const [cmd] = input.toLowerCase().split(/\s+/);

    switch (cmd) {
      case 'exit':
      case 'quit':
        this.rl.close();
        return true;

      case 'clear':
        process.stdout.write('\x1b[2J\x1b[H');
        return true;

      case 'help':
        this.showHelp();
        return true;

      case 'history':
        this.showHistory();
        return true;

      case 'session':
        console.log(ansi.success(`Session ID: ${this.sessionId}`));
        return true;

      case 'tools':
        this.showTools();
        return true;

      default:
        return false;
    }
  }

  private showHelp(): void {
    console.log(`
${ansi.bold('Commands:')}
  ${ansi.tool('exit')}     Exit the CLI
  ${ansi.tool('quit')}     Exit the CLI
  ${ansi.tool('clear')}    Clear the screen
  ${ansi.tool('history')}  Show message history
  ${ansi.tool('session')}  Show current session ID
  ${ansi.tool('tools')}    List available tools
  ${ansi.tool('help')}     Show this help message

${ansi.bold('Usage:')}
  Type your message and press Enter to chat with the AI agent.
  The agent can use tools like file operations and shell commands.
`);
  }

  private showHistory(): void {
    const messages = this.sessionManager.getHistory(this.sessionId, 20);
    console.log(`\n${ansi.bold('Recent Messages:')}`);
    
    for (const msg of messages) {
      const prefix = msg.role === 'user' ? ansi.userInput('[You]') : ansi.assistant('[AI]');
      const content = msg.content.length > 100 
        ? msg.content.substring(0, 100) + '...'
        : msg.content;
      console.log(`${prefix} ${content}`);
    }
    console.log();
  }

  private showTools(): void {
    const { toolRegistry } = require('../tools/index.js');
    const tools = toolRegistry.listNames();
    
    console.log(`\n${ansi.bold('Available Tools:')}`);
    for (const name of tools) {
      console.log(`  ${ansi.tool(name)}`);
    }
    console.log();
  }

  private handleClose(): void {
    ansi.showCursor();
    console.log(`\n${ansi.success('Goodbye!')}\n`);
  }

  private handleSIGINT(): void {
    if (this.isStreaming) {
      process.stdout.write('\n');
      this.isStreaming = false;
    } else {
      this.rl.close();
    }
  }

  async start(): Promise<void> {
    ansi.hideCursor();
    console.log(ansi.header('LxzClaw CLI'));
    console.log('Type "help" for commands, "exit" to quit.\n');
    
    this.rl.prompt();
  }

  close(): void {
    ansi.showCursor();
    this.rl.close();
  }
}
