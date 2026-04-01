/**
 * Skill System - Hot-loadable skill modules
 * 
 * Skills are TypeScript/JavaScript modules that extend agent capabilities.
 * They can be loaded at runtime without restarting the application.
 */

import fs from 'fs/promises';
import fsSync, { FSWatcher } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

export interface SkillConfig {
  name: string;
  description: string;
  version: string;
  author?: string;
}

export interface SkillMetadata extends SkillConfig {
  path: string;
  loadedAt: number;
  enabled: boolean;
}

export interface SkillModule {
  skill: SkillConfig;
  execute?: (input: unknown, context: SkillContext) => Promise<unknown>;
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onAgentMessage?: (message: unknown, context: SkillContext) => unknown;
}

export interface SkillContext {
  skillId: string;
  skillName: string;
  workspace?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class SkillLoader extends EventEmitter {
  private skills: Map<string, SkillMetadata> = new Map();
  private skillModules: Map<string, SkillModule> = new Map();
  private skillsDir: string;
  private watchEnabled: boolean = false;
  private watcher?: FSWatcher;

  constructor(skillsDir?: string) {
    super();
    this.skillsDir = skillsDir ?? path.join(process.cwd(), 'skills');
  }

  async init(): Promise<void> {
    // Create skills directory if it doesn't exist
    await fs.mkdir(this.skillsDir, { recursive: true });
    
    // Load all skills from directory
    await this.loadAllSkills();
    
    logger.info(`SkillLoader initialized with ${this.skills.size} skills`);
  }

  async loadAllSkills(): Promise<void> {
    try {
      const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(this.skillsDir, entry.name);
          await this.loadSkill(skillPath);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error(`Failed to load skills: ${error}`);
      }
    }
  }

  async loadSkill(skillPath: string): Promise<boolean> {
    const skillName = path.basename(skillPath);
    
    if (this.skills.has(skillName)) {
      logger.debug(`Skill ${skillName} already loaded`);
      return false;
    }

    try {
      // Try loading as TypeScript or JavaScript
      const possibleFiles = [
        path.join(skillPath, 'index.ts'),
        path.join(skillPath, 'index.js'),
        path.join(skillPath, `${skillName}.ts`),
        path.join(skillPath, `${skillName}.js`),
        path.join(skillPath, 'skill.ts'),
        path.join(skillPath, 'skill.js'),
      ];

      let skillFile: string | null = null;
      for (const file of possibleFiles) {
        try {
          await fs.access(file);
          skillFile = file;
          break;
        } catch {
          // File doesn't exist
        }
      }

      if (!skillFile) {
        // Check for skill.json metadata
        const metaPath = path.join(skillPath, 'skill.json');
        try {
          const metaContent = await fs.readFile(metaPath, 'utf-8');
          const meta = JSON.parse(metaContent) as SkillMetadata;
          this.skills.set(skillName, { ...meta, path: skillPath, loadedAt: Date.now(), enabled: true });
          logger.debug(`Skill ${skillName} registered (metadata only)`);
          return true;
        } catch {
          logger.debug(`No skill file found in ${skillPath}`);
          return false;
        }
      }

      // Dynamic import of skill module
      const module = await import(`file://${skillFile}`);
      const skillModule = module.default ?? module;
      
      if (!skillModule.skill?.name) {
        logger.warn(`Skill ${skillName} missing required skill.name property`);
        return false;
      }

      this.skillModules.set(skillName, skillModule);
      this.skills.set(skillName, {
        ...skillModule.skill,
        path: skillPath,
        loadedAt: Date.now(),
        enabled: true,
      });

      // Call onLoad hook if present
      if (skillModule.onLoad) {
        await skillModule.onLoad();
      }

      logger.info(`Skill loaded: ${skillModule.skill.name} v${skillModule.skill.version}`);
      this.emit('skill_loaded', skillModule.skill);
      
      return true;
    } catch (error) {
      logger.error(`Failed to load skill ${skillName}: ${error}`);
      return false;
    }
  }

  async unloadSkill(skillName: string): Promise<boolean> {
    const module = this.skillModules.get(skillName);
    if (!module) {
      return false;
    }

    // Call onUnload hook if present
    if (module.onUnload) {
      try {
        await module.onUnload();
      } catch (error) {
        logger.error(`Skill ${skillName} onUnload failed: ${error}`);
      }
    }

    this.skillModules.delete(skillName);
    this.skills.delete(skillName);
    
    logger.info(`Skill unloaded: ${skillName}`);
    this.emit('skill_unloaded', skillName);
    
    return true;
  }

  async reloadSkill(skillName: string): Promise<boolean> {
    const meta = this.skills.get(skillName);
    if (!meta) {
      return false;
    }

    await this.unloadSkill(skillName);
    return this.loadSkill(meta.path);
  }

  async executeSkill(skillName: string, input: unknown, context: SkillContext): Promise<unknown> {
    const module = this.skillModules.get(skillName);
    if (!module?.execute) {
      throw new Error(`Skill ${skillName} has no execute function`);
    }

    const skillContext: SkillContext = {
      ...context,
      skillId: skillName,
      skillName: module.skill?.name ?? skillName,
    };

    return module.execute(input, skillContext);
  }

  enableWatch(): void {
    if (this.watchEnabled) return;
    
    this.watchEnabled = true;
    
    this.watcher = fsSync.watch(this.skillsDir, { recursive: true }, (eventType: string, filename: string | Buffer | null) => {
      if (!filename) return;
      const name = typeof filename === 'string' ? filename : filename.toString();
      logger.debug(`Skills directory changed: ${eventType} - ${name}`);
      
      // Debounce - wait a bit for multiple changes
      setTimeout(async () => {
        if (eventType === 'rename') {
          const skillName = path.basename(path.dirname(name));
          const exists = await fs.access(path.join(this.skillsDir, skillName)).then(() => true).catch(() => false);
          
          if (exists) {
            await this.loadSkill(path.join(this.skillsDir, skillName));
          } else {
            await this.unloadSkill(skillName);
          }
        } else if (eventType === 'change') {
          await this.reloadSkill(path.basename(name));
        }
      }, 500);
    });

    logger.info('Skill watch enabled');
  }

  disableWatch(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
    this.watchEnabled = false;
    logger.info('Skill watch disabled');
  }

  getSkills(): SkillMetadata[] {
    return Array.from(this.skills.values());
  }

  getSkill(name: string): SkillMetadata | undefined {
    return this.skills.get(name);
  }

  getSkillModule(name: string): SkillModule | undefined {
    return this.skillModules.get(name);
  }

  isLoaded(name: string): boolean {
    return this.skills.has(name);
  }

  async createSkillTemplate(name: string): Promise<void> {
    const skillDir = path.join(this.skillsDir, name);
    await fs.mkdir(skillDir, { recursive: true });

    const template: SkillModule = {
      skill: {
        name,
        description: `A custom skill: ${name}`,
        version: '1.0.0',
        author: 'LxzClaw User',
      },
      async execute(input: unknown, context: SkillContext): Promise<unknown> {
        logger.info(`Skill ${context.skillName} executing with input:`, input);
        return { success: true, result: `Hello from ${name}!`, input };
      },
    };

    await fs.writeFile(
      path.join(skillDir, 'index.ts'),
      `/**
 * ${name} skill
 */

const skill = {
  skill: {
    name: '${name}',
    description: 'A custom skill: ${name}',
    version: '1.0.0',
    author: 'LxzClaw User',
  },

  async execute(input: unknown, context: SkillContext): Promise<unknown> {
    logger.info('${name} executing with input:', input);
    return { success: true, result: 'Hello from ${name}!', input };
  },
};

export default skill;
`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(skillDir, 'skill.json'),
      JSON.stringify(template.skill, null, 2),
      'utf-8'
    );

    logger.info(`Skill template created: ${skillDir}`);
  }

  async shutdown(): Promise<void> {
    this.disableWatch();
    
    // Unload all skills
    for (const skillName of this.skills.keys()) {
      await this.unloadSkill(skillName);
    }
    
    logger.info('SkillLoader shutdown complete');
  }
}

// Singleton instance
export const skillLoader = new SkillLoader();
