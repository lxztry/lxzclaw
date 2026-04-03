/**
 * Built-in tools index
 */

import { toolRegistry } from '../registry.js';
import { createBashTool } from './bash.js';
import { createReadTool, createWriteTool, createEditTool, createGlobTool } from './read.js';
import { createWebSearchTool, createWebFetchTool } from './web.js';

export function registerBuiltInTools(): void {
  // Register built-in tools
  const bashTool = createBashTool();
  bashTool.requireConfirm = true;
  toolRegistry.register(bashTool);

  toolRegistry.register(createReadTool());

  const writeTool = createWriteTool();
  writeTool.requireConfirm = true;
  toolRegistry.register(writeTool);

  const editTool = createEditTool();
  editTool.requireConfirm = true;
  toolRegistry.register(editTool);

  toolRegistry.register(createGlobTool());
  toolRegistry.register(createWebSearchTool());
  toolRegistry.register(createWebFetchTool());
}

export { createBashTool, createReadTool, createWriteTool, createEditTool, createGlobTool, createWebSearchTool, createWebFetchTool };
