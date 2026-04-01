/**
 * Observability System for LxzClaw
 * 
 * Provides:
 * - Task metrics and tracking
 * - Task timeline/history
 * - Structured logging
 * - Health checks
 * - Webhook notifications
 * - Dashboard metrics API
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  type: 'started' | 'completed' | 'failed' | 'retry';
  timestamp: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  checks: Record<string, boolean>;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    activeAgents: number;
    avgTaskDuration: number;
  };
}

export interface WebhookConfig {
  url: string;
  events: string[];
  headers?: Record<string, string>;
}

export class Observability extends EventEmitter {
  private metrics: Map<string, Metric[]> = new Map();
  private taskHistory: TaskEvent[] = [];
  private taskMetrics: Map<string, { startTime: number; attempts: number }> = new Map();
  private startTime: number;
  private webhooks: WebhookConfig[] = [];
  private maxHistorySize: number = 1000;
  private maxMetricsPerName: number = 100;

  constructor() {
    super();
    this.startTime = Date.now();
    
    // Forward all events to webhooks
    this.on('task_started', (taskId) => this.recordTaskEvent('started', taskId));
    this.on('task_completed', (taskId, duration) => this.recordTaskEvent('completed', taskId, duration));
    this.on('task_failed', (taskId, error) => this.recordTaskEvent('failed', taskId, undefined, error));
  }

  // ==================== Metrics ====================

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    const existing = this.metrics.get(name) ?? [];
    existing.push(metric);
    
    // Keep only recent metrics
    if (existing.length > this.maxMetricsPerName) {
      existing.shift();
    }
    
    this.metrics.set(name, existing);
    this.emit('metric_recorded', metric);
  }

  getMetrics(name: string, since?: number): Metric[] {
    const metrics = this.metrics.get(name) ?? [];
    if (since) {
      return metrics.filter(m => m.timestamp >= since);
    }
    return [...metrics];
  }

  getAllMetrics(): Record<string, Metric[]> {
    return Object.fromEntries(this.metrics);
  }

  // ==================== Task Tracking ====================

  startTask(taskId: string): void {
    this.taskMetrics.set(taskId, { startTime: Date.now(), attempts: 1 });
    this.recordMetric('task_started_total', 1, { task_id: taskId.substring(0, 8) });
    this.emit('task_started', taskId);
  }

  completeTask(taskId: string): void {
    const taskMeta = this.taskMetrics.get(taskId);
    if (!taskMeta) return;

    const duration = Date.now() - taskMeta.startTime;
    this.taskMetrics.delete(taskId);
    this.recordTaskEvent('completed', taskId, duration);
    this.recordMetric('task_duration_ms', duration);
    this.recordMetric('task_completed_total', 1);
    this.emit('task_completed', taskId, duration);
  }

  failTask(taskId: string, error: string): void {
    const taskMeta = this.taskMetrics.get(taskId);
    if (!taskMeta) return;

    const duration = Date.now() - taskMeta.startTime;
    this.recordTaskEvent('failed', taskId, duration, error);
    this.recordMetric('task_failed_total', 1);
    this.recordMetric('task_duration_ms', duration);
    this.emit('task_failed', taskId, error);
  }

  private recordTaskEvent(
    type: TaskEvent['type'],
    taskId: string,
    duration?: number,
    error?: string
  ): void {
    const event: TaskEvent = {
      id: randomUUID(),
      taskId,
      type,
      timestamp: Date.now(),
      duration,
      error,
    };

    this.taskHistory.push(event);

    // Keep history bounded
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory.shift();
    }

    this.notifyWebhooks(type, event);
  }

  getTaskHistory(limit?: number, since?: number): TaskEvent[] {
    let events = this.taskHistory;
    
    if (since) {
      events = events.filter(e => e.timestamp >= since);
    }
    
    if (limit) {
      events = events.slice(-limit);
    }
    
    return events;
  }

  getTaskMetrics(taskId: string): { startTime: number; attempts: number } | undefined {
    return this.taskMetrics.get(taskId);
  }

  // ==================== Health ====================

  getHealthStatus(activeAgents: number): HealthStatus {
    const now = Date.now();
    const completedTasks = this.taskHistory.filter(e => e.type === 'completed').length;
    const failedTasks = this.taskHistory.filter(e => e.type === 'failed').length;
    
    const completedDurations = this.taskHistory
      .filter(e => e.type === 'completed' && e.duration)
      .map(e => e.duration!);
    const avgDuration = completedDurations.length > 0
      ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
      : 0;

    const checks = {
      agentEngine: activeAgents > 0,
      taskProcessing: this.taskMetrics.size < 100, // Max concurrent tasks
      metricsStorage: this.metrics.size > 0,
    };

    const allHealthy = Object.values(checks).every(Boolean);
    const status = allHealthy ? 'healthy' : 'degraded';

    return {
      status,
      uptime: now - this.startTime,
      checks,
      metrics: {
        totalTasks: this.taskHistory.length,
        completedTasks,
        failedTasks,
        activeAgents,
        avgTaskDuration: Math.round(avgDuration),
      },
    };
  }

  // ==================== Webhooks ====================

  registerWebhook(config: WebhookConfig): void {
    this.webhooks.push(config);
    logger.info(`Webhook registered: ${config.url}`);
  }

  unregisterWebhook(url: string): boolean {
    const index = this.webhooks.findIndex(w => w.url === url);
    if (index !== -1) {
      this.webhooks.splice(index, 1);
      return true;
    }
    return false;
  }

  private async notifyWebhooks(eventType: string, data: unknown): Promise<void> {
    for (const webhook of this.webhooks) {
      if (!webhook.events.includes(eventType) && !webhook.events.includes('*')) {
        continue;
      }

      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers,
          },
          body: JSON.stringify({
            event: eventType,
            timestamp: Date.now(),
            data,
          }),
        });
      } catch (error) {
        logger.error(`Webhook notification failed: ${error}`);
      }
    }
  }

  // ==================== Summary ====================

  getSummary(): {
    uptime: number;
    metricsCount: number;
    taskHistoryCount: number;
    activeTasks: number;
    webhookCount: number;
  } {
    return {
      uptime: Date.now() - this.startTime,
      metricsCount: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.length, 0),
      taskHistoryCount: this.taskHistory.length,
      activeTasks: this.taskMetrics.size,
      webhookCount: this.webhooks.length,
    };
  }

  reset(): void {
    this.metrics.clear();
    this.taskHistory = [];
    this.taskMetrics.clear();
    logger.info('Observability state reset');
    this.emit('reset');
  }
}

// Singleton instance
export const observability = new Observability();
