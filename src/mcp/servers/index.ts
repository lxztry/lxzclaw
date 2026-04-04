/**
 * MCP Servers Index
 * Built-in MCP server implementations
 */

export { filesystemTools, handleFilesystemTool } from './filesystem.js';
export { gitTools, handleGitTool } from './git.js';
export { websearchTools, handleWebsearchTool } from './websearch.js';

export interface MCPServer {
  name: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
  handler: (tool: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export const builtInServers: MCPServer[] = [
  {
    name: 'filesystem',
    tools: require('./filesystem.js').filesystemTools,
    handler: require('./filesystem.js').handleFilesystemTool
  },
  {
    name: 'git',
    tools: require('./git.js').gitTools,
    handler: require('./git.js').handleGitTool
  },
  {
    name: 'websearch',
    tools: require('./websearch.js').websearchTools,
    handler: require('./websearch.js').handleWebsearchTool
  }
];
