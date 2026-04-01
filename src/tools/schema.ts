/**
 * Tool schema definitions
 */

// Tool result types
export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Tool definition
export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

export interface ToolContext {
  sessionId: string;
  workspace?: string;
  cwd?: string;
}
