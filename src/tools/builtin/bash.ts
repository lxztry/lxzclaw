/**
 * Bash tool - execute shell commands
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolContext, ToolResult } from '../schema.js';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,
  /del\s+\/[sqf]/i,
  /format\s+/i,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\/sd/i,
  /chmod\s+777/i,
  /chown\s+-r/i,
  /curl.*\|\s*bash/i,
  /wget.*\|\s*bash/i,
  /powershell.*-enc/i,
  /:\s*!\s*\/bin\/sh/i,
  /fork\(\)/i,
];

const ALLOWED_COMMANDS = new Set([
  'git', 'npm', 'node', 'pnpm', 'yarn', 'bun',
  'ls', 'dir', 'cat', 'type', 'echo', 'pwd', 'cd',
  'mkdir', 'rmdir', 'copy', 'move', 'del', 'rm',
  'find', 'grep', 'ag', 'rg', 'head', 'tail', 'wc',
  'sort', 'uniq', 'awk', 'sed', 'cut', 'tr',
  'curl', 'wget', 'tar', 'zip', 'unzip',
  'python', 'python3', 'pip', 'uv',
  'go', 'cargo', 'rustc', 'make', 'cmake',
  'docker', 'kubectl', 'helm',
  'code', 'code-insiders', 'cursor',
]);

function isCommandAllowed(command: string): boolean {
  const cmd = command.trim().split(/\s+/)[0].toLowerCase();
  const baseCmd = cmd.replace(/^python\d*/, 'python').replace(/^node\d*/, 'node');
  return ALLOWED_COMMANDS.has(baseCmd) || ALLOWED_COMMANDS.has(cmd);
}

function hasDangerousPattern(command: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(command));
}

export function createBashTool(options: {
  enabled?: boolean;
  timeout?: number;
  shell?: string;
  allowDangerous?: boolean;
} = {}): Tool {
  const timeout = options.timeout ?? 30000;
  const shell = options.shell ?? (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');
  const allowDangerous = options.allowDangerous ?? false;

  return {
    name: 'bash',
    description: 'Execute a shell command and return the output',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        timeout: { type: 'number', description: 'Timeout in milliseconds (optional)' },
        cwd: { type: 'string', description: 'Working directory (optional)' },
      },
      required: ['command'],
    },

    async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
      const { command, timeout: inputTimeout, cwd } = input as { command: string; timeout?: number; cwd?: string };
      const execTimeout = inputTimeout ?? timeout;

      if (!allowDangerous) {
        if (!isCommandAllowed(command)) {
          return {
            success: false,
            error: `Command not allowed: ${command.split(' ')[0]}. Use only safe commands like git, npm, node, ls, etc.`,
          };
        }
        if (hasDangerousPattern(command)) {
          return {
            success: false,
            error: 'Dangerous command pattern detected. This command is not allowed for security reasons.',
          };
        }
      }

      logger.debug(`Executing bash: ${command}`);

      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: execTimeout,
          shell,
          cwd: cwd ?? context.cwd ?? context.workspace,
        });

        return {
          success: true,
          output: stdout + (stderr ? `\nSTDERR: ${stderr}` : ''),
        };
      } catch (error) {
        const execError = error as { killed?: boolean; code?: number; stderr?: string };
        return {
          success: false,
          error: execError.stderr ?? `Command failed with code ${execError.code}`,
          metadata: {
            killed: execError.killed,
            code: execError.code,
          },
        };
      }
    },
  };
}
