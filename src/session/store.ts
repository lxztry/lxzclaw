/**
 * Session store - persists sessions to filesystem
 */

import fs from 'fs/promises';
import path from 'path';
import { Session } from './types.js';
import { logger } from '../utils/logger.js';

export class SessionStore {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async init(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  private sessionPath(id: string): string {
    return path.join(this.basePath, `${id}.json`);
  }

  async save(session: Session): Promise<void> {
    const filePath = this.sessionPath(session.id);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
    logger.debug(`Session saved: ${session.id}`);
  }

  async load(id: string): Promise<Session | null> {
    const filePath = this.sessionPath(id);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Session;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const filePath = this.sessionPath(id);
    try {
      await fs.unlink(filePath);
      logger.debug(`Session deleted: ${id}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const filePath = this.sessionPath(id);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
