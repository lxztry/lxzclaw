/**
 * CLI entry point
 */

import { runCLI, runGateway, createCLI } from './commands.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default: run interactive CLI
    await runCLI();
    return;
  }

  const program = createCLI();
  
  // Handle gateway command separately
  if (args[0] === 'gateway') {
    await runGateway();
    return;
  }

  // Handle single chat mode
  if (args[0] === 'chat' && args.length > 1) {
    const message = args.slice(1).join(' ');
    await runCLI({ chat: message });
    return;
  }

  // Let commander handle other commands
  await program.parseAsync(args);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
