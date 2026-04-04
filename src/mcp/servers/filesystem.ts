/**
 * MCP Filesystem Server
 * Provides file system operations as MCP tools
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export const filesystemTools = [
  {
    name: 'read_file',
    description: 'Read contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
        encoding: { type: 'string', description: 'File encoding (default: utf-8)' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
        append: { type: 'boolean', description: 'Append to file instead of overwriting' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'List contents of a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
        recursive: { type: 'boolean', description: 'List recursively' }
      },
      required: ['path']
    }
  },
  {
    name: 'create_directory',
    description: 'Create a new directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to create' },
        recursive: { type: 'boolean', description: 'Create parent directories if needed' }
      },
      required: ['path']
    }
  },
  {
    name: 'delete_file',
    description: 'Delete a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete' }
      },
      required: ['path']
    }
  },
  {
    name: 'file_exists',
    description: 'Check if a file or directory exists',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to check' }
      },
      required: ['path']
    }
  },
  {
    name: 'get_file_info',
    description: 'Get information about a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Search for files matching a pattern',
    inputSchema: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Directory to search in' },
        pattern: { type: 'string', description: 'Glob pattern (e.g., *.ts, **/*.js)' },
        maxResults: { type: 'number', description: 'Maximum number of results' }
      },
      required: ['directory', 'pattern']
    }
  }
];

export async function handleFilesystemTool(tool: string, args: Record<string, unknown>) {
  switch (tool) {
    case 'read_file': {
      const content = await fs.readFile(args.path as string, args.encoding as BufferEncoding || 'utf-8');
      return { content };
    }
    
    case 'write_file': {
      const flags = args.append ? 'a' : 'w';
      await fs.writeFile(args.path as string, args.content as string, { flag: flags });
      return { success: true, path: args.path };
    }
    
    case 'list_directory': {
      const entries = await fs.readdir(args.path as string, { withFileTypes: true, recursive: args.recursive as boolean });
      return { entries: entries.map(e => ({ name: e.name, isDirectory: e.isDirectory(), isFile: e.isFile() })) };
    }
    
    case 'create_directory': {
      await fs.mkdir(args.path as string, { recursive: args.recursive as boolean ?? true });
      return { success: true, path: args.path };
    }
    
    case 'delete_file': {
      await fs.unlink(args.path as string);
      return { success: true, path: args.path };
    }
    
    case 'file_exists': {
      try {
        await fs.access(args.path as string);
        return { exists: true };
      } catch {
        return { exists: false };
      }
    }
    
    case 'get_file_info': {
      const stats = await fs.stat(args.path as string);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    }
    
    case 'search_files': {
      // Simple glob-like search using fs.readdir recursive
      const results: string[] = [];
      const maxResults = (args.maxResults as number) || 100;
      
      async function search(dir: string, pattern: string) {
        if (results.length >= maxResults) return;
        
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (results.length >= maxResults) break;
            
            const fullPath = path.join(dir, entry.name);
            
            if (entry.name.match(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'))) {
              results.push(fullPath);
            }
            
            if (entry.isDirectory()) {
              await search(fullPath, pattern);
            }
          }
        } catch {
          // Skip inaccessible directories
        }
      }
      
      await search(args.directory as string, args.pattern as string);
      return { files: results };
    }
    
    default:
      return { error: `Unknown tool: ${tool}` };
  }
}
