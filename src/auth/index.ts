/**
 * Authentication System
 * 
 * Features:
 * - API Token authentication
 * - JWT token support
 * - Rate limiting
 * - User session management
 */

import { randomBytes, createHash } from 'crypto';
import { logger } from '../utils/logger.js';

export interface TokenInfo {
  token: string;
  hash: string;
  userId: string;
  name?: string;
  createdAt: number;
  expiresAt?: number;
  scopes: string[];
  lastUsed?: number;
}

export interface AuthConfig {
  enabled: boolean;
  tokens?: string[];
  jwtSecret?: string;
  jwtExpiresIn?: string;  // e.g., "24h", "7d"
  rateLimitWindow?: number;  // ms
  rateLimitMax?: number;  // requests per window
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  scopes?: string[];
  error?: string;
}

export class AuthManager {
  private tokens: Map<string, TokenInfo> = new Map();
  private config: AuthConfig;

  constructor(config: AuthConfig = { enabled: false }) {
    this.config = {
      rateLimitWindow: 60000,  // 1 minute
      rateLimitMax: 100,
      ...config,
      enabled: config.enabled ?? false,
    };

    // Initialize tokens from config
    if (this.config.tokens) {
      for (const token of this.config.tokens) {
        this.addToken(token);
      }
    }

    logger.info(`AuthManager initialized (enabled: ${this.config.enabled})`);
  }

  /**
   * Generate a new API token
   */
  generateToken(options: {
    userId: string;
    name?: string;
    expiresIn?: string;
    scopes?: string[];
  }): string {
    const token = randomBytes(32).toString('hex');
    const hash = this.hashToken(token);

    const expiresAt = options.expiresIn 
      ? this.parseExpiry(options.expiresIn) 
      : undefined;

    const info: TokenInfo = {
      token: hash,  // Store hash, not actual token
      hash,
      userId: options.userId,
      name: options.name,
      createdAt: Date.now(),
      expiresAt,
      scopes: options.scopes ?? ['read', 'write'],
    };

    this.tokens.set(hash, info);
    logger.info(`Generated token for user: ${options.userId}`);

    // Return actual token (only shown once!)
    return token;
  }

  /**
   * Add a pre-existing token
   */
  addToken(token: string, options?: Partial<Omit<TokenInfo, 'token' | 'hash'>>): void {
    const hash = this.hashToken(token);
    const info: TokenInfo = {
      token: hash,
      hash,
      userId: options?.userId ?? 'default',
      name: options?.name,
      createdAt: Date.now(),
      expiresAt: options?.expiresAt,
      scopes: options?.scopes ?? ['read', 'write'],
    };
    this.tokens.set(hash, info);
  }

  /**
   * Revoke a token
   */
  revokeToken(token: string): boolean {
    const hash = this.hashToken(token);
    const deleted = this.tokens.delete(hash);
    if (deleted) {
      logger.info(`Revoked token: ${hash.substring(0, 8)}...`);
    }
    return deleted;
  }

  /**
   * Validate a token and return auth result
   */
  validateToken(token: string): AuthResult {
    if (!this.config.enabled) {
      return { success: true, userId: 'anonymous', scopes: ['read', 'write'] };
    }

    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const hash = this.hashToken(token);
    const info = this.tokens.get(hash);

    if (!info) {
      return { success: false, error: 'Invalid token' };
    }

    // Check expiration
    if (info.expiresAt && info.expiresAt < Date.now()) {
      this.tokens.delete(hash);
      return { success: false, error: 'Token expired' };
    }

    // Update last used
    info.lastUsed = Date.now();

    return { success: true, userId: info.userId, scopes: info.scopes };
  }

  /**
   * Extract token from Authorization header
   */
  extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    
    return authHeader;
  }

  /**
   * Check if request is authenticated (middleware style)
   */
  authenticate(authHeader: string | undefined): AuthResult {
    const token = this.extractToken(authHeader);
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }
    return this.validateToken(token);
  }

  /**
   * Check if user has required scope
   */
  hasScope(authResult: AuthResult, requiredScope: string): boolean {
    if (!authResult.success) return false;
    if (!authResult.scopes) return true;  // No scopes means all allowed
    return authResult.scopes.includes(requiredScope);
  }

  /**
   * Get all tokens (metadata only, not actual tokens)
   */
  listTokens(): Array<Omit<TokenInfo, 'token'>> {
    return Array.from(this.tokens.values()).map(({ token, hash, ...rest }) => ({
      hash: hash.substring(0, 8) + '...',
      ...rest,
    }));
  }

  /**
   * Create middleware-compatible auth check
   */
  createMiddleware(options: {
    requiredScope?: string;
    optional?: boolean;
  } = {}) {
    return (req: { headers: Record<string, string> }): AuthResult => {
      const authHeader = req.headers.authorization;
      const result = this.authenticate(authHeader);

      if (!result.success && !options.optional) {
        return result;
      }

      if (result.success && options.requiredScope) {
        if (!this.hasScope(result, options.requiredScope)) {
          return { success: false, error: `Missing required scope: ${options.requiredScope}` };
        }
      }

      return result;
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      logger.warn(`Invalid expiry format: ${expiry}, using 24h`);
      return Date.now() + 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return Date.now() + value * multipliers[unit];
  }
}

// Simple JWT implementation (no external dependencies)
export function createJWT(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url');
  
  const signature = createHash('sha256')
    .update(`${header}.${body}.${secret}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  
  const expectedSig = createHash('sha256')
    .update(`${header}.${body}.${secret}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}

// Rate limiter
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private window: number;
  private max: number;

  constructor(window: number = 60000, max: number = 100) {
    this.window = window;
    this.max = max;
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const windowStart = now - this.window;
    
    // Get existing requests
    const timestamps = this.requests.get(key)?.filter(t => t > windowStart) ?? [];
    
    if (timestamps.length >= this.max) {
      const resetAt = Math.min(...timestamps) + this.window;
      return { allowed: false, remaining: 0, resetAt };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);

    return { allowed: true, remaining: this.max - timestamps.length, resetAt: now + this.window };
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}
