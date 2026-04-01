/**
 * Logger utility with structured logging support
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const levelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

const levelColors: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m',   // Cyan
  [LogLevel.INFO]: '\x1b[32m',    // Green
  [LogLevel.WARN]: '\x1b[33m',    // Yellow
  [LogLevel.ERROR]: '\x1b[31m',   // Red
};

const RESET = '\x1b[0m';

export interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  quiet?: boolean;
}

export class Logger {
  private name: string;
  private level: LogLevel;
  private quiet: boolean;

  constructor(options: LoggerOptions = {}) {
    this.name = options.name ?? 'lxzclaw';
    this.level = options.level ?? LogLevel.INFO;
    this.quiet = options.quiet ?? false;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (level < this.level || this.quiet) return;

    const timestamp = new Date().toISOString();
    const color = levelColors[level];
    const levelName = levelNames[level];
    
    const prefix = `${color}[${timestamp}] [${levelName}] [${this.name}]${RESET}`;
    const formattedMessage = args.length > 0 
      ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`
      : message;

    if (level >= LogLevel.ERROR) {
      console.error(`${prefix} ${formattedMessage}`);
    } else {
      console.log(`${prefix} ${formattedMessage}`);
    }
  }

  child(name: string): Logger {
    return new Logger({ 
      name: `${this.name}:${name}`, 
      level: this.level,
      quiet: this.quiet 
    });
  }
}

// Global logger instance
export const logger = new Logger({ name: 'lxzclaw' });

export function setLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}
