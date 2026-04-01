/**
 * File read tool
 */

import fs from 'fs/promises';
import path from 'path';
import { Tool, ToolContext, ToolResult } from '../schema.js';
import { logger } from '../../utils/logger.js';

export function createReadTool(): Tool {
  return {
    name: 'read',
    description: 'Read the contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
        offset: { type: 'number', description: 'Line offset to start reading' },
        limit: { type: 'number', description: 'Maximum lines to read' },
      },
      required: ['path'],
    },

    async execute(input: unknown, _context: ToolContext): Promise<ToolResult> {
      const { path: filePath, offset, limit } = input as { path: string; offset?: number; limit?: number };

      logger.debug(`Reading file: ${filePath}`);

      try {
        let content = await fs.readFile(filePath, 'utf-8');
        
        const lines = content.split('\n');
        if (offset !== undefined || limit !== undefined) {
          const start = offset ?? 0;
          const end = limit !== undefined ? start + limit : undefined;
          content = lines.slice(start, end).join('\n');
        }

        return {
          success: true,
          output: content,
          metadata: {
            path: filePath,
            size: content.length,
            lines: lines.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

export function createWriteTool(): Tool {
  return {
    name: 'write',
    description: 'Write content to a file (creates or overwrites)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },

    async execute(input: unknown, _context: ToolContext): Promise<ToolResult> {
      const { path: filePath, content } = input as { path: string; content: string };

      logger.debug(`Writing file: ${filePath}`);

      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');

        return {
          success: true,
          output: `Written ${content.length} bytes to ${filePath}`,
          metadata: {
            path: filePath,
            size: content.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

export function createEditTool(): Tool {
  return {
    name: 'edit',
    description: 'Edit a file by replacing exact text',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to edit' },
        oldText: { type: 'string', description: 'Exact text to find and replace' },
        newText: { type: 'string', description: 'Replacement text' },
      },
      required: ['path', 'oldText', 'newText'],
    },

    async execute(input: unknown, _context: ToolContext): Promise<ToolResult> {
      const { path: filePath, oldText, newText } = input as { path: string; oldText: string; newText: string };

      logger.debug(`Editing file: ${filePath}`);

      try {
        let content = await fs.readFile(filePath, 'utf-8');
        
        if (!content.includes(oldText)) {
          return {
            success: false,
            error: `Text not found in file: ${oldText.substring(0, 50)}...`,
          };
        }

        content = content.replace(oldText, newText);
        await fs.writeFile(filePath, content, 'utf-8');

        return {
          success: true,
          output: `Edited ${filePath}`,
          metadata: {
            path: filePath,
            oldLength: oldText.length,
            newLength: newText.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

export function createGlobTool(): Tool {
  return {
    name: 'glob',
    description: 'Find files matching a glob pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g., **/*.ts)' },
        cwd: { type: 'string', description: 'Working directory' },
      },
      required: ['pattern'],
    },

    async execute(input: unknown, _context: ToolContext): Promise<ToolResult> {
      const { pattern, cwd } = input as { pattern: string; cwd?: string };

      try {
        const { glob } = await import('glob');
        logger.debug(`Glob: ${pattern} in ${cwd ?? process.cwd()}`);
        const files = await glob(pattern, { cwd: cwd ?? process.cwd() });
        return {
          success: true,
          output: files.join('\n'),
          metadata: { count: files.length },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
