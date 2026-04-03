/**
 * MCP Client - Model Context Protocol 客户端 (简化版)
 */

import { spawn, ChildProcess } from 'child_process';
import { Tool, ToolResult, ToolContext } from '../tools/schema.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

export interface MCPConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export class MCPClient extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();
  private tools: Map<string, Tool> = new Map();
  private serverTools: Map<string, MCPTool[]> = new Map();

  async connectServer(name: string, config: MCPConfig): Promise<void> {
    logger.info(`Connecting MCP server: ${name}`);

    const proc = spawn(config.command, config.args ?? [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...config.env },
    });

    this.processes.set(name, proc);

    // 初始化 MCP 协议
    const initializeRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'lxzclaw',
          version: '1.0.0',
        },
      },
    };

    proc.stdin?.write(JSON.stringify(initializeRequest) + '\n');

    // 处理输出
    let buffer = '';
    proc.stdout?.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          this.handleMessage(name, msg);
        } catch {
          // 非 JSON 消息
        }
      }
    });

    proc.stderr?.on('data', (data) => {
      logger.debug(`MCP ${name} stderr: ${data.toString()}`);
    });

    // 等待初始化完成
    await this.waitForMessage(name, 1);
    
    // 获取工具列表
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    };
    proc.stdin?.write(JSON.stringify(toolsRequest) + '\n');

    const toolsResponse = await this.waitForMessage(name, 2);
    const mcpTools = (toolsResponse as any).result?.tools ?? [];
    this.serverTools.set(name, mcpTools);
    
    logger.info(`MCP server ${name} provides ${mcpTools.length} tools`);

    // 转换为 LxzClaw 工具
    for (const mcpTool of mcpTools) {
      const tool: Tool = {
        name: `mcp_${name}_${mcpTool.name}`,
        description: mcpTool.description ?? `MCP tool: ${mcpTool.name}`,
        inputSchema: mcpTool.inputSchema ?? { type: 'object', properties: {} },
        execute: async (input: unknown, _context: ToolContext): Promise<ToolResult> => {
          return this.callTool(name, mcpTool.name, input as Record<string, unknown>);
        },
      };
      this.tools.set(tool.name, tool);
    }

    logger.info(`MCP server ${name} connected successfully`);
  }

  private pendingMessages: Map<string, Map<number, any>> = new Map();

  private handleMessage(serverName: string, msg: any): void {
    if (msg.id) {
      if (!this.pendingMessages.has(serverName)) {
        this.pendingMessages.set(serverName, new Map());
      }
      this.pendingMessages.get(serverName)?.set(msg.id, msg);
    }
  }

  private async waitForMessage(serverName: string, id: number): Promise<any> {
    return new Promise((resolve) => {
      const check = () => {
        const msg = this.pendingMessages.get(serverName)?.get(id);
        if (msg) {
          this.pendingMessages.get(serverName)?.delete(id);
          resolve(msg);
          return true;
        }
        return false;
      };
      
      if (!check()) {
        const interval = setInterval(() => {
          if (check()) {
            clearInterval(interval);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(interval);
          resolve({});
        }, 5000);
      }
    });
  }

  private async callTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    const proc = this.processes.get(serverName);
    if (!proc || !proc.stdin) {
      return { success: false, error: `MCP server ${serverName} not connected` };
    }

    const id = Date.now();
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    proc.stdin.write(JSON.stringify(request) + '\n');

    const response = await this.waitForMessage(serverName, id);
    
    if ((response as any).error) {
      return {
        success: false,
        error: (response as any).error.message,
      };
    }

    return {
      success: true,
      output: JSON.stringify((response as any).result?.content ?? ''),
    };
  }

  async disconnectServer(name: string): Promise<void> {
    const proc = this.processes.get(name);
    if (proc) {
      proc.kill();
      this.processes.delete(name);
      
      // 移除相关工具
      for (const toolName of this.tools.keys()) {
        if (toolName.startsWith(`mcp_${name}_`)) {
          this.tools.delete(toolName);
        }
      }
      this.serverTools.delete(name);
      
      logger.info(`MCP server ${name} disconnected`);
    }
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  listServerNames(): string[] {
    return Array.from(this.processes.keys());
  }

  async closeAll(): Promise<void> {
    for (const name of this.processes.keys()) {
      await this.disconnectServer(name);
    }
  }
}

export const mcpClient = new MCPClient();