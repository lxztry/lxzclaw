/**
 * Built-in tools index
 */

import { toolRegistry } from '../registry.js';
import { createBashTool } from './bash.js';
import { createReadTool, createWriteTool, createEditTool, createGlobTool } from './read.js';
import { createWebSearchTool, createWebFetchTool } from './web.js';

export function registerBuiltInTools(): void {
  // Register built-in tools
  toolRegistry.register(createBashTool());
  toolRegistry.register(createReadTool());
  toolRegistry.register(createWriteTool());
  toolRegistry.register(createEditTool());
  toolRegistry.register(createGlobTool());
  toolRegistry.register(createWebSearchTool());
  toolRegistry.register(createWebFetchTool());
}

export { createBashTool, createReadTool, createWriteTool, createEditTool, createGlobTool, createWebSearchTool, createWebFetchTool };
