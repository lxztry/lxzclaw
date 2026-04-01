/**
 * Bash tool - execute shell commands
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolContext, ToolResult } from '../schema.js';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

export function createBashTool(options: {
  enabled?: boolean;
  timeout?: number;
  shell?: string;
} = {}): Tool {
  const timeout = options.timeout ?? 30000;
  const shell = options.shell ?? (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');

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
