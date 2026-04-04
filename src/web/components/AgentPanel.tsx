/**
 * LxzClaw Agent Visualization Panel
 * Agent 可视化面板组件
 */

import React, { useState, useEffect } from 'react';

// ============== 类型定义 ==============

interface Agent {
  id: string;
  name: string;
  role: 'supervisor' | 'worker' | 'specialist';
  status: 'idle' | 'busy' | 'error';
  capabilities: string[];
  currentTask?: string;
  taskProgress: number;
}

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  result?: string;
  progress: number;
  logs: string[];
}

interface WorkflowRun {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  startTime: number;
}

// ============== Agent 卡片组件 ==============

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  const statusColor = {
    idle: 'bg-green-500',
    busy: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const roleLabel = {
    supervisor: '🔧 主管',
    worker: '⚙️ 工人',
    specialist: '🎯 专家'
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {agent.role === 'supervisor' ? '🔧' : agent.role === 'worker' ? '⚙️' : '🎯'}
          </span>
          <div>
            <div className="font-semibold">{agent.name}</div>
            <div className="text-sm text-gray-500">{roleLabel[agent.role]}</div>
          </div>
        </div>
        <span className={`w-3 h-3 rounded-full ${statusColor[agent.status]}`} />
      </div>
      
      {agent.currentTask && (
        <div className="mb-2">
          <div className="text-sm text-gray-600 truncate">{agent.currentTask}</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${agent.taskProgress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-1 mt-2">
        {agent.capabilities.slice(0, 3).map(cap => (
          <span key={cap} className="text-xs bg-gray-100 px-2 py-1 rounded">
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="text-xs text-gray-400">+{agent.capabilities.length - 3}</span>
        )}
      </div>
    </div>
  );
};

// ============== 任务列表组件 ==============

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskClick }) => {
  const statusIcon = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold mb-4">📋 任务列表</h3>
      <div className="space-y-3">
        {tasks.map(task => (
          <div 
            key={task.id}
            className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => onTaskClick?.(task)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{statusIcon[task.status]}</span>
                <span className="font-medium text-sm truncate max-w-[200px]">
                  {task.description}
                </span>
              </div>
              {task.assignedAgent && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {task.assignedAgent}
                </span>
              )}
            </div>
            
            {task.status === 'running' && (
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
};

// ============== 工作流可视化组件 ==============

interface WorkflowVizProps {
  workflow: WorkflowRun;
}

const WorkflowViz: React.FC<WorkflowVizProps> = ({ workflow }) => {
  const steps = Array.from({ length: workflow.totalSteps }, (_, i) => i + 1);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">🔄 {workflow.name}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${
          workflow.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
          workflow.status === 'completed' ? 'bg-green-100 text-green-700' :
          'bg-red-100 text-red-700'
        }`}>
          {workflow.status === 'running' ? '运行中' :
           workflow.status === 'completed' ? '已完成' : '失败'}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                ${idx < workflow.currentStep ? 'bg-green-500 text-white' :
                  idx === workflow.currentStep ? 'bg-blue-500 text-white animate-pulse' :
                  'bg-gray-200 text-gray-400'}`}>
                {idx < workflow.currentStep ? '✓' : step}
              </div>
              <span className="text-xs mt-1">步骤 {step}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${
                idx < workflow.currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        用时: {Math.round((Date.now() - workflow.startTime) / 1000)}s
      </div>
    </div>
  );
};

// ============== Agent 日志面板 ==============

interface LogPanelProps {
  logs: string[];
  maxHeight?: string;
}

const LogPanel: React.FC<LogPanelProps> = ({ logs, maxHeight = '300px' }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4 overflow-auto" style={{ maxHeight }}>
      <div className="font-mono text-sm text-green-400">
        {logs.map((log, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============== 主面板组件 ==============

interface AgentPanelProps {
  agents: Agent[];
  tasks: Task[];
  currentWorkflow?: WorkflowRun;
  className?: string;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  agents,
  tasks,
  currentWorkflow,
  className = ''
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'logs'>('agents');

  return (
    <div className={`bg-gray-100 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🤖 Agent 工作台</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-white rounded-full text-sm">
            👥 {agents.length} Agent
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-sm">
            📋 {tasks.filter(t => t.status === 'running').length} 运行中
          </span>
        </div>
      </div>

      {/* 工作流可视化 */}
      {currentWorkflow && (
        <div className="mb-4">
          <WorkflowViz workflow={currentWorkflow} />
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'agents', label: '👥 Agent', count: agents.length },
          { key: 'tasks', label: '📋 任务', count: tasks.length },
          { key: 'logs', label: '📜 日志', count: 0 }
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.key 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeTab === 'agents' && (
          <div className="space-y-3">
            {agents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent}
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskList 
            tasks={tasks}
            onTaskClick={(task) => console.log('Task clicked:', task)}
          />
        )}

        {activeTab === 'logs' && (
          <LogPanel logs={tasks.flatMap(t => t.logs)} />
        )}
      </div>

      {/* Agent 详情弹窗 */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{selectedAgent.name}</h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedAgent(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-gray-500">角色：</span>
                <span>{selectedAgent.role}</span>
              </div>
              <div>
                <span className="text-gray-500">状态：</span>
                <span className={selectedAgent.status === 'idle' ? 'text-green-500' : 
                  selectedAgent.status === 'busy' ? 'text-yellow-500' : 'text-red-500'}>
                  {selectedAgent.status === 'idle' ? '空闲' :
                   selectedAgent.status === 'busy' ? '工作中' : '错误'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">能力：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedAgent.capabilities.map(cap => (
                    <span key={cap} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPanel;

// ============== 使用示例 ==============

/**
 * 使用示例：
 * 
 * const [agents, setAgents] = useState<Agent[]>([
 *   { id: '1', name: 'CodeBot', role: 'worker', status: 'busy', capabilities: ['coding'], currentTask: '编写登录功能', taskProgress: 60 },
 *   { id: '2', name: 'ReviewBot', role: 'reviewer', status: 'idle', capabilities: ['review'], taskProgress: 0 },
 * ]);
 * 
 * const [tasks, setTasks] = useState<Task[]>([
 *   { id: 't1', description: '实现用户登录功能', status: 'running', progress: 60, logs: ['分析需求...', '编写代码...'] },
 * ]);
 * 
 * const [workflow] = useState<WorkflowRun>({
 *   id: 'w1', name: '代码审查工作流', status: 'running', currentStep: 2, totalSteps: 3, startTime: Date.now()
 * });
 * 
 * <AgentPanel agents={agents} tasks={tasks} currentWorkflow={workflow} />
 */
