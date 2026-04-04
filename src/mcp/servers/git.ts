/**
 * MCP Git Server
 * Provides Git operations as MCP tools
 */

export const gitTools = [
  {
    name: 'git_status',
    description: 'Get the current git status',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Repository path (default: current directory)' }
      }
    }
  },
  {
    name: 'git_log',
    description: 'Get git commit history',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Repository path' },
        maxCount: { type: 'number', description: 'Maximum number of commits to return' },
        format: { type: 'string', description: 'Output format (short, oneline, full)' }
      }
    }
  },
  {
    name: 'git_branch',
    description: 'List git branches',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Repository path' },
        all: { type: 'boolean', description: 'Show all branches (including remote)' }
      }
    }
  },
  {
    name: 'git_diff',
    description: 'Show changes between commits or working directory',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Repository path' },
        target: { type: 'string', description: 'Target (commit, branch, or compare like "main..HEAD")' },
        staged: { type: 'boolean', description: 'Show staged changes only' }
      }
    }
  },
  {
    name: 'git_commit',
    description: 'Create a new git commit',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Repository path' },
        message: { type: 'string', description: 'Commit message' },
        all: { type: 'boolean', description: 'Stage all modified files automatically' }
      },
      required: ['message']
    }
  },
  {
    name: 'git_push',
    description: 'Push commits to remote',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Repository path' },
        remote: { type: 'string', description: 'Remote name (default: origin)' },
        branch: { type: 'string', description: 'Branch to push' }
      }
    }
  },
  {
    name: 'git_pull',
    description: 'Pull changes from remote',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Repository path' },
        remote: { type: 'string', description: 'Remote name' },
        branch: { type: 'string', description: 'Branch to pull' }
      }
    }
  },
  {
    name: 'git_clone',
    description: 'Clone a repository',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Repository URL to clone' },
        destination: { type: 'string', description: 'Destination directory' },
        branch: { type: 'string', description: 'Branch to clone (optional)' }
      },
      required: ['url']
    }
  }
];

export async function handleGitTool(tool: string, args: Record<string, unknown>) {
  const { execSync } = require('child_process');
  
  function runGit(cwd: string, ...cmd: string[]): string {
    try {
      return execSync(cmd.join(' '), { cwd, encoding: 'utf-8', stdio: 'pipe' });
    } catch (e: unknown) {
      const error = e as { message?: string };
      return `Error: ${error.message || 'Unknown error'}`;
    }
  }
  
  const cwd = (args.repoPath as string) || process.cwd();
  
  switch (tool) {
    case 'git_status': {
      const output = runGit(cwd, 'git status --porcelain');
      return { status: output || 'Clean working directory' };
    }
    
    case 'git_log': {
      const format = (args.format as string) || 'short';
      const maxCount = (args.maxCount as number) || 10;
      const output = runGit(cwd, `git log --${format} -n ${maxCount}`);
      return { log: output };
    }
    
    case 'git_branch': {
      const all = args.all ? '-a' : '';
      const output = runGit(cwd, `git branch ${all}`);
      return { branches: output.split('\n').filter(b => b.trim()) };
    }
    
    case 'git_diff': {
      let cmd = 'git diff';
      if (args.staged) cmd += ' --staged';
      if (args.target) cmd += ` ${args.target}`;
      const output = runGit(cwd, cmd);
      return { diff: output || 'No changes' };
    }
    
    case 'git_commit': {
      const allFlag = args.all ? ' -a' : '';
      const output = runGit(cwd, `git commit${allFlag} -m "${args.message}"`);
      return { commit: output || 'Commit created successfully' };
    }
    
    case 'git_push': {
      const remote = (args.remote as string) || 'origin';
      const branch = (args.branch as string) || '';
      const output = runGit(cwd, `git push ${remote} ${branch}`);
      return { push: output || 'Push completed' };
    }
    
    case 'git_pull': {
      const remote = (args.remote as string) || 'origin';
      const branch = (args.branch as string) || '';
      const output = runGit(cwd, `git pull ${remote} ${branch}`);
      return { pull: output || 'Pull completed' };
    }
    
    case 'git_clone': {
      const dest = (args.destination as string) || '.';
      const branch = args.branch ? `--branch ${args.branch}` : '';
      const output = runGit(dest, `git clone ${args.url} ${dest} ${branch}`);
      return { clone: output || 'Clone completed' };
    }
    
    default:
      return { error: `Unknown tool: ${tool}` };
  }
}
