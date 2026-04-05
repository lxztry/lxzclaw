/**
 * LxzClaw Agent Teams
 * 真正的多 Agent Teams 架构，参考 Claude Code Agent Teams 设计
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import type { AgentConfig } from './multi-agent.js';

// ============== 类型定义 ==============

export interface AgentTeamConfig {
  teamId: string;
  teamLead?: AgentInstance;
  members: AgentInstance[];
  sharedTaskList: TaskList;
  mailbox: Mailbox;
}

export interface AgentInstance {
  id: string;
  name: string;
  type: 'team-lead' | 'teammate';
  status: 'idle' | 'thinking' | 'working' | 'error';
  capabilities: string[];
  context: AgentContext;
  mailbox: Mailbox;
  spawn?: (config: AgentConfig) => AgentInstance;
}

export interface AgentContext {
  messages: Message[];
  tasks: Task[];
  artifacts: Artifact[];
  recentMentions: string[];
}

export interface TaskList {
  id: string;
  tasks: Task[];
  addTask(task: Task): void;
  updateTask(id: string, updates: Partial<Task>): void;
  getTask(id: string): Task | undefined;
  getTasksByStatus(status: TaskStatus): Task[];
  completeTask(id: string): void;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  result?: string;
  dependencies?: string[];
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'request' | 'response' | 'notification' | 'broadcast';
  timestamp: number;
  read: boolean;
  replyTo?: string;
}

export interface Artifact {
  id: string;
  type: 'code' | 'document' | 'design' | 'test';
  name: string;
  content: string;
  createdBy: string;
  createdAt: number;
  shared: boolean;
}

export interface Mailbox {
  address: string;
  messages: Message[];
  send(to: string, content: string, type?: Message['type']): void;
  receive(from: string): Message[];
  broadcast(content: string): void;
  getUnread(): Message[];
}

// ============== Mailbox 实现 ==============

export class MailboxImpl implements Mailbox {
  public address: string;
  public messages: Message[] = [];

  constructor(address: string) {
    this.address = address;
  }

  send(to: string, content: string, type: Message['type'] = 'request'): void {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.address,
      to,
      content,
      type,
      timestamp: Date.now(),
      read: false
    };
    this.messages.push(message);
    logger.info(`[Mailbox ${this.address}] Sent to ${to}: ${content.substring(0, 50)}...`);
  }

  receive(from: string): Message[] {
    const unread = this.messages.filter(
      m => m.from === from && !m.read
    );
    unread.forEach(m => m.read = true);
    return unread;
  }

  broadcast(content: string): void {
    // Broadcast goes to team lead's mailbox
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.address,
      to: 'broadcast',
      content,
      type: 'broadcast',
      timestamp: Date.now(),
      read: false
    };
    this.messages.push(message);
    logger.info(`[Mailbox ${this.address}] Broadcast: ${content.substring(0, 50)}...`);
  }

  getUnread(): Message[] {
    return this.messages.filter(m => !m.read);
  }
}

// ============== TaskList 实现 ==============

export class TaskListImpl implements TaskList {
  public id: string;
  public tasks: Task[] = [];
  private emitter: EventEmitter;

  constructor(id: string) {
    this.id = id;
    this.emitter = new EventEmitter();
  }

  addTask(task: Task): void {
    this.tasks.push(task);
    this.emitter.emit('task:added', task);
    logger.info(`[TaskList ${this.id}] Added task: ${task.title}`);
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates, { updatedAt: Date.now() });
      this.emitter.emit('task:updated', task);
    }
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks.filter(t => t.status === status);
  }

  completeTask(id: string): void {
    const task = this.getTask(id);
    if (task) {
      task.status = 'completed';
      task.completedAt = Date.now();
      this.emitter.emit('task:completed', task);
    }
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.emitter.on(event, handler);
  }
}

// ============== Agent Teams ==============

export class AgentTeam extends EventEmitter {
  private config: AgentTeamConfig;
  private teamLead: AgentInstance;
  private members: Map<string, AgentInstance> = new Map();
  private isRunning: boolean = false;

  constructor(config: Partial<AgentTeamConfig> & { teamId: string }) {
    super();
    
    // 创建 Team Lead
    this.teamLead = {
      id: 'team-lead',
      name: 'Team Lead',
      type: 'team-lead',
      status: 'idle',
      capabilities: ['coordination', 'planning', 'review'],
      context: { messages: [], tasks: [], artifacts: [], recentMentions: [] },
      mailbox: new MailboxImpl('team-lead')
    };

    // 创建共享 Task List
    const sharedTaskList = new TaskListImpl(config.teamId);

    this.config = {
      teamId: config.teamId,
      teamLead: this.teamLead,
      members: [],
      sharedTaskList,
      mailbox: this.teamLead.mailbox
    };

    logger.info(`[AgentTeam ${config.teamId}] Created with Team Lead`);
  }

  /**
   * 添加 Team Member
   */
  addMember(config: { 
    id: string; 
    name: string; 
    capabilities: string[];
  }): AgentInstance {
    const member: AgentInstance = {
      id: config.id,
      name: config.name,
      type: 'teammate',
      status: 'idle',
      capabilities: config.capabilities,
      context: { messages: [], tasks: [], artifacts: [], recentMentions: [] },
      mailbox: new MailboxImpl(config.id)
    };

    this.members.set(config.id, member);
    this.config.members.push(member);
    
    logger.info(`[AgentTeam ${this.config.teamId}] Added member: ${config.name}`);
    
    return member;
  }

  /**
   * 创建 Task
   */
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.config.sharedTaskList.addTask(newTask);
    return newTask;
  }

  /**
   * 分配 Task 给 Member
   */
  assignTask(taskId: string, memberId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) {
      logger.warn(`[AgentTeam] Member ${memberId} not found`);
      return false;
    }

    this.config.sharedTaskList.updateTask(taskId, {
      assignedTo: memberId,
      status: 'in-progress'
    });

    // 通知 Member
    member.mailbox.send(
      'team-lead',
      `New task assigned: ${taskId}`,
      'request'
    );

    logger.info(`[AgentTeam] Task ${taskId} assigned to ${memberId}`);
    return true;
  }

  /**
   * Member 之间直接通信 (Mailbox)
   */
  sendMessage(from: string, to: string, content: string): void {
    const fromAgent = this.getAgent(from);
    if (fromAgent) {
      fromAgent.mailbox.send(to, content);
    }
  }

  /**
   * Member 广播消息
   */
  broadcast(from: string, content: string): void {
    const fromAgent = this.getAgent(from);
    if (fromAgent) {
      fromAgent.mailbox.broadcast(content);
    }
  }

  /**
   * 获取 Agent
   */
  getAgent(id: string): AgentInstance | undefined {
    if (id === 'team-lead') return this.teamLead;
    return this.members.get(id);
  }

  /**
   * 获取所有 Agent
   */
  getAllAgents(): AgentInstance[] {
    return [this.teamLead, ...Array.from(this.members.values())];
  }

  /**
   * 获取共享 Task List
   */
  getTaskList(): TaskList {
    return this.config.sharedTaskList;
  }

  /**
   * Team 状态
   */
  getStatus(): {
    teamId: string;
    isRunning: boolean;
    memberCount: number;
    taskStats: { pending: number; inProgress: number; completed: number };
  } {
    const tasks = this.config.sharedTaskList.tasks;
    return {
      teamId: this.config.teamId,
      isRunning: this.isRunning,
      memberCount: this.members.size,
      taskStats: {
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      }
    };
  }

  /**
   * 运行 Team (Team Lead 协调)
   */
  async run(initialTasks?: string[]): Promise<void> {
    if (this.isRunning) {
      logger.warn('[AgentTeam] Already running');
      return;
    }

    this.isRunning = true;
    logger.info(`[AgentTeam ${this.config.teamId}] Starting...`);

    // 添加初始任务
    initialTasks?.forEach(title => {
      this.createTask({
        title,
        description: title,
        status: 'pending',
        priority: 'medium'
      });
    });

    // Team Lead 开始协调
    await this.coordinate();

    logger.info(`[AgentTeam ${this.config.teamId}] Completed`);
  }

  /**
   * Team Lead 协调逻辑
   */
  private async coordinate(): Promise<void> {
    while (this.isRunning) {
      // 获取未分配的任务
      const pendingTasks = this.config.sharedTaskList.getTasksByStatus('pending');
      
      if (pendingTasks.length === 0) {
        // 检查是否有正在执行的任务
        const inProgress = this.config.sharedTaskList.getTasksByStatus('in-progress');
        if (inProgress.length === 0) {
          break; // 所有任务完成
        }
        await this.wait(1000); // 等待任务完成
        continue;
      }

      // 分配任务给合适的 Member
      for (const task of pendingTasks) {
        const suitableMember = this.findSuitableMember(task);
        if (suitableMember) {
          this.assignTask(task.id, suitableMember.id);
        }
      }

      await this.wait(500);
    }
  }

  /**
   * 找到合适的 Member
   */
  private findSuitableMember(_task: Task): AgentInstance | undefined {
    // 简单策略：找到空闲的 Member
    for (const member of this.members.values()) {
      if (member.status === 'idle') {
        return member;
      }
    }
    return undefined;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 停止 Team
   */
  stop(): void {
    this.isRunning = false;
    this.emit('stopped');
    logger.info(`[AgentTeam ${this.config.teamId}] Stopped`);
  }
}

// ============== Agent Team 工厂 ==============

export class AgentTeamFactory {
  /**
   * 创建代码审查 Team
   */
  static createCodeReviewTeam(): AgentTeam {
    const team = new AgentTeam({ teamId: 'code-review' });

    team.addMember({
      id: 'coder',
      name: 'CodeBot',
      capabilities: ['coding', 'refactoring', 'testing']
    });

    team.addMember({
      id: 'reviewer',
      name: 'ReviewBot',
      capabilities: ['review', 'security', 'performance']
    });

    team.addMember({
      id: 'tester',
      name: 'TestBot',
      capabilities: ['testing', 'qa', 'verification']
    });

    return team;
  }

  /**
   * 创建 DevOps Team
   */
  static createDevOpsTeam(): AgentTeam {
    const team = new AgentTeam({ teamId: 'devops' });

    team.addMember({
      id: 'builder',
      name: 'BuildBot',
      capabilities: ['build', 'compile', 'package']
    });

    team.addMember({
      id: 'deployer',
      name: 'DeployBot',
      capabilities: ['deploy', 'infrastructure', 'docker', 'k8s']
    });

    team.addMember({
      id: 'monitor',
      name: 'MonitorBot',
      capabilities: ['monitoring', 'alerts', 'metrics']
    });

    return team;
  }

  /**
   * 创建全栈开发 Team
   */
  static createFullStackTeam(): AgentTeam {
    const team = new AgentTeam({ teamId: 'fullstack' });

    team.addMember({
      id: 'frontend',
      name: 'FrontendBot',
      capabilities: ['react', 'vue', 'css', 'ui']
    });

    team.addMember({
      id: 'backend',
      name: 'BackendBot',
      capabilities: ['node', 'python', 'api', 'database']
    });

    team.addMember({
      id: 'devops',
      name: 'DevOpsBot',
      capabilities: ['deploy', 'ci', 'docker', 'cloud']
    });

    return team;
  }
}
