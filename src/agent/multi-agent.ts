/**
 * Multi-Agent Coordination System
 * 
 * Supports:
 * - Agent pools with different capabilities
 * - Supervisor/worker pattern
 * - Parallel task execution
 * - Inter-agent messaging
 */

import { EventEmitter } from 'events';
import { AgentEngine } from './engine.js';
import { Config } from '../config/index.js';
import { SessionManager } from '../session/index.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';
import { observability } from '../observability/index.js';

export interface AgentConfig {
  id: string;
  name: string;
  role: 'supervisor' | 'worker' | 'specialist';
  capabilities: string[];
  model?: string;
}

export interface Task {
  id: string;
  description: string;
  priority?: 'low' | 'normal' | 'high';
  assignedAgent?: string;
  result?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies?: string[];
}

export interface AgentMessage {
  from: string;
  to: string;
  content: string;
  type: 'task' | 'result' | 'query' | 'response';
  taskId?: string;
}

export class MultiAgentCoordinator extends EventEmitter {
  private agents: Map<string, { config: AgentConfig; engine?: AgentEngine }> = new Map();
  private tasks: Map<string, Task> = new Map();
  private messageQueue: AgentMessage[] = [];
  private config: Config;
  private sessionManager: SessionManager;

  constructor(config: Config, sessionManager: SessionManager) {
    super();
    this.config = config;
    this.sessionManager = sessionManager;
  }

  async registerAgent(agentConfig: AgentConfig): Promise<void> {
    if (this.agents.has(agentConfig.id)) {
      logger.warn(`Agent ${agentConfig.id} already registered`);
      return;
    }

    const engine = new AgentEngine(this.config, this.sessionManager);
    await engine.init();

    this.agents.set(agentConfig.id, { config: agentConfig, engine });
    logger.info(`Registered agent: ${agentConfig.name} (${agentConfig.role})`);
    
    this.emit('agent_registered', agentConfig);
  }

  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    if (agent.engine) {
      await agent.engine.shutdown();
    }
    
    this.agents.delete(agentId);
    logger.info(`Unregistered agent: ${agentId}`);
    this.emit('agent_unregistered', agentId);
  }

  createTask(description: string, options: {
    priority?: 'low' | 'normal' | 'high';
    assignedAgent?: string;
    dependencies?: string[];
  } = {}): Task {
    const task: Task = {
      id: randomUUID(),
      description,
      priority: options.priority ?? 'normal',
      assignedAgent: options.assignedAgent,
      status: 'pending',
      dependencies: options.dependencies,
    };

    this.tasks.set(task.id, task);
    logger.debug(`Created task: ${task.id} - ${description.substring(0, 50)}...`);
    
    return task;
  }

  async executeTask(taskId: string, context?: string): Promise<string> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check dependencies
    if (task.dependencies?.length) {
      for (const depId of task.dependencies) {
        const dep = this.tasks.get(depId);
        if (dep?.status !== 'completed') {
          throw new Error(`Dependency ${depId} not completed for task ${taskId}`);
        }
      }
    }

    // Find available agent
    let agent = task.assignedAgent ? this.agents.get(task.assignedAgent) : undefined;
    
    if (!agent) {
      // Find first available worker
      for (const [, a] of this.agents) {
        if (a.config.role === 'worker' || a.config.role === 'supervisor') {
          agent = a;
          break;
        }
      }
    }

    if (!agent?.engine) {
      throw new Error('No available agent for task execution');
    }

    task.status = 'in_progress';
    this.emit('task_started', task);
    observability.startTask(task.id);

    try {
      const session = this.sessionManager.create({ 
        type: 'task',
      });

      const systemPrompt = context ?? `You are ${agent.config.name}, a ${agent.config.role} agent. ${agent.config.capabilities.length ? `Your capabilities: ${agent.config.capabilities.join(', ')}` : ''}`;
      
      const result = await agent.engine.processMessage(session.id, task.description, {
        systemPrompt,
      });

      task.result = result;
      task.status = 'completed';
      this.emit('task_completed', task, result);
      observability.completeTask(task.id);
      
      return result;
    } catch (error) {
      task.status = 'failed';
      this.emit('task_failed', task, error);
      observability.failTask(task.id, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async executeTasksParallel(taskIds: string[]): Promise<string[]> {
    return Promise.all(taskIds.map(id => this.executeTask(id)));
  }

  async executeTasksSequential(taskIds: string[]): Promise<string[]> {
    const results: string[] = [];
    for (const id of taskIds) {
      results.push(await this.executeTask(id));
    }
    return results;
  }

  // Inter-agent messaging
  async sendMessage(message: AgentMessage): Promise<void> {
    const fromAgent = this.agents.get(message.from);
    const toAgent = this.agents.get(message.to);

    if (!fromAgent || !toAgent) {
      throw new Error(`Invalid agent(s): ${!fromAgent ? message.from : message.to}`);
    }

    logger.debug(`Message from ${message.from} to ${message.to}: ${message.type}`);

    if (message.type === 'query') {
      // Process query and send response
      const session = this.sessionManager.create({ type: 'task' });
      const response = await fromAgent.engine!.processMessage(session.id, message.content);
      
      const reply: AgentMessage = {
        from: message.to,
        to: message.from,
        content: response,
        type: 'response',
        taskId: message.taskId,
      };
      
      this.messageQueue.push(reply);
      this.emit('message', reply);
    } else {
      this.messageQueue.push(message);
      this.emit('message', message);
    }
  }

  getMessages(agentId: string): AgentMessage[] {
    return this.messageQueue.filter(m => m.to === agentId);
  }

  clearMessages(agentId?: string): void {
    if (agentId) {
      this.messageQueue = this.messageQueue.filter(m => m.to !== agentId);
    } else {
      this.messageQueue = [];
    }
  }

  getAgents(): AgentConfig[] {
    return Array.from(this.agents.values()).map(a => a.config);
  }

  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  async shutdown(): Promise<void> {
    for (const [id] of this.agents) {
      await this.unregisterAgent(id);
    }
    logger.info('Multi-agent coordinator shutdown complete');
  }
}

// Factory for common agent configurations
export const AgentTemplates = {
  supervisor: (name: string, capabilities?: string[]): AgentConfig => ({
    id: randomUUID(),
    name,
    role: 'supervisor',
    capabilities: capabilities ?? ['planning', 'coordination', 'reasoning'],
  }),

  coder: (name: string): AgentConfig => ({
    id: randomUUID(),
    name,
    role: 'specialist',
    capabilities: ['coding', 'debugging', 'code_review'],
  }),

  researcher: (name: string): AgentConfig => ({
    id: randomUUID(),
    name,
    role: 'specialist',
    capabilities: ['web_search', 'information_gathering', 'analysis'],
  }),

  reviewer: (name: string): AgentConfig => ({
    id: randomUUID(),
    name,
    role: 'specialist',
    capabilities: ['code_review', 'testing', 'quality_assurance'],
  }),
};
