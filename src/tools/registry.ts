/**
 * Tool registry - manages available tools
 */

import { Tool, ToolResult, ToolContext } from './schema.js';
import { logger } from '../utils/logger.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} is already registered, overwriting`);
    }
    this.tools.set(tool.name, tool);
    logger.debug(`Tool registered: ${tool.name}`);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  listNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolSchemas(): Array<{ name: string; description: string; input_schema: Record<string, unknown> }> {
    return this.list().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema ?? {},
    }));
  }

  async execute(name: string, input: unknown, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
    }

    try {
      const result = await tool.execute(input, context);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeAll(
    tools: Array<{ name: string; input: unknown }>,
    context: ToolContext
  ): Promise<Map<string, ToolResult>> {
    const results = new Map<string, ToolResult>();

    for (const { name, input } of tools) {
      results.set(name, await this.execute(name, input, context));
    }

    return results;
  }
}

// Global registry instance
export const toolRegistry = new ToolRegistry();
