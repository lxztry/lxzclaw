/**
 * Audit Logger - 安全审计日志
 */

import { appendFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import { logger } from './logger.js';

export interface AuditEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'auth' | 'tool' | 'api' | 'session' | 'security';
  action: string;
  userId?: string;
  sessionId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  success: boolean;
  error?: string;
}

class AuditLogger {
  private logPath: string;
  private enabled: boolean = true;

  constructor(logDir?: string) {
    const dir = logDir ?? path.join(os.homedir(), '.lxzclaw', 'logs');
    this.logPath = path.join(dir, 'audit.log');
  }

  async init(): Promise<void> {
    try {
      await mkdir(path.dirname(this.logPath), { recursive: true });
    } catch {
      // Directory may already exist
    }
  }

  async log(event: AuditEvent): Promise<void> {
    if (!this.enabled) return;

    const logLine = JSON.stringify(event) + '\n';
    
    try {
      await appendFile(this.logPath, logLine);
    } catch {
      // Silently fail if audit logging fails
    }

    // Also log to main logger for visibility
    const level = event.level === 'error' ? 'error' : event.level === 'warn' ? 'warn' : 'info';
    logger[level](`[AUDIT] ${event.category}: ${event.action}`, {
      ...event,
      details: undefined,
    });
  }

  private sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'apiKey', 'authorization'];
    
    for (const [k, v] of Object.entries(input)) {
      if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'string' && v.length > 1000) {
        sanitized[k] = v.substring(0, 1000) + '...[TRUNCATED]';
      } else {
        sanitized[k] = v;
      }
    }
    
    return sanitized;
  }

  async authLogin(userId: string, success: boolean, ip?: string): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: success ? 'info' : 'error',
      category: 'auth',
      action: 'login',
      userId,
      ip,
      success,
    });
  }

  async authTokenCreate(userId: string, tokenName?: string): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'auth',
      action: 'token_create',
      userId,
      details: { tokenName },
      success: true,
    });
  }

  async toolExecute(
    toolName: string,
    sessionId: string,
    input: Record<string, unknown>,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: success ? 'info' : 'error',
      category: 'tool',
      action: toolName,
      sessionId,
      details: { input: this.sanitizeInput(input) },
      success,
      error,
    });
  }

  async apiCall(
    endpoint: string,
    method: string,
    userId: string | undefined,
    success: boolean,
    statusCode: number | undefined,
    ip: string | undefined
  ): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: success ? 'info' : 'error',
      category: 'api',
      action: `${method} ${endpoint}`,
      userId,
      ip,
      details: { statusCode },
      success,
    });
  }

  async securityEvent(action: string, details: Record<string, unknown>, severity: 'info' | 'warn' | 'error' = 'warn'): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: severity,
      category: 'security',
      action,
      details,
      success: false,
    });
  }

  disable(): void {
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }
}

export const auditLogger = new AuditLogger();