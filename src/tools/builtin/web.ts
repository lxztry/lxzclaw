/**
 * Web tools - search and fetch
 */

import { Tool, ToolContext, ToolResult } from '../schema.js';
import { logger } from '../../utils/logger.js';

export function createWebSearchTool(): Tool {
  return {
    name: 'web_search',
    description: 'Search the web for information',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        count: { type: 'number', description: 'Number of results (default: 5)' },
      },
      required: ['query'],
    },

    async execute(input: unknown, _context: ToolContext): Promise<ToolResult> {
      const { query, count = 5 } = input as { query: string; count?: number };

      logger.debug(`Web search: ${query}`);

      return {
        success: true,
        output: `Search results for "${query}" would appear here.\nConfigure a web search API (e.g., Brave Search) for actual results.`,
        metadata: {
          query,
          count,
          note: 'Web search requires API configuration',
        },
      };
    },
  };
}

export function createWebFetchTool(): Tool {
  return {
    name: 'web_fetch',
    description: 'Fetch and extract content from a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
        maxChars: { type: 'number', description: 'Maximum characters to return' },
      },
      required: ['url'],
    },

    async execute(input: unknown, _context: ToolContext): Promise<ToolResult> {
      const { url, maxChars } = input as { url: string; maxChars?: number };

      logger.debug(`Web fetch: ${url}`);

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'LxzClaw/1.0 (AI Agent)',
          },
        });

        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        let content = await response.text();

        content = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (maxChars && content.length > maxChars) {
          content = content.substring(0, maxChars) + '...[truncated]';
        }

        return {
          success: true,
          output: content,
          metadata: {
            url,
            contentLength: content.length,
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
