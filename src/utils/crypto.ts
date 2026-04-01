/**
 * Async utility functions
 */

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutError ?? `Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

export class AsyncQueue<T> {
  private queue: T[] = [];
  private resolvers: Array<(value: T) => void> = [];
  private rejectors: Array<(error: Error) => void> = [];
  private closed = false;

  async take(): Promise<T> {
    if (this.resolvers.length > 0) {
      const resolver = this.resolvers.shift()!;
      const value = this.queue.shift()!;
      resolver(value);
      return value;
    }
    
    if (this.closed) {
      throw new Error('Queue is closed');
    }

    return new Promise<T>((resolve, reject) => {
      this.resolvers.push(resolve);
      this.rejectors.push(reject);
    });
  }

  put(value: T): void {
    if (this.closed) {
      throw new Error('Queue is closed');
    }

    if (this.resolvers.length > 0) {
      const resolver = this.resolvers.shift()!;
      resolver(value);
      return;
    }

    this.queue.push(value);
  }

  close(): void {
    this.closed = true;
    for (const reject of this.rejectors) {
      reject(new Error('Queue closed'));
    }
    this.resolvers = [];
    this.rejectors = [];
  }

  get size(): number {
    return this.queue.length;
  }

  get isClosed(): boolean {
    return this.closed;
  }
}

export class Mutex {
  private locked = false;
  private waiters: Array<() => void> = [];

  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.release();
    }

    return new Promise<() => void>((resolve) => {
      this.waiters.push(() => resolve(() => this.release()));
    }).then(release => {
      this.locked = true;
      return release;
    });
  }

  private release(): void {
    if (this.waiters.length > 0) {
      const next = this.waiters.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }

  get isLocked(): boolean {
    return this.locked;
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = 2, onError } = options;

  let lastError: Error | undefined;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) break;
      
      onError?.(lastError, attempt);
      await sleep(delay);
      delay *= backoff;
    }
  }

  throw lastError;
}
