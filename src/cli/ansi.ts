/**
 * ANSI formatting utilities for CLI
 */

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

export function bold(text: string): string {
  return `${colors.bold}${text}${colors.reset}`;
}

export function color(colorName: keyof typeof colors, text: string): string {
  return `${colors[colorName]}${text}${colors.reset}`;
}

export function prompt(text: string): string {
  return `${colors.cyan}${colors.bold}lxzclaw${colors.reset} ${color('green', '>')} ${text}`;
}

export function userInput(text: string): string {
  return `${colors.blue}${text}${colors.reset}`;
}

export function assistant(text: string): string {
  return `${colors.green}${text}${colors.reset}`;
}

export function tool(text: string): string {
  return `${colors.yellow}${text}${colors.reset}`;
}

export function error(text: string): string {
  return `${colors.red}${text}${colors.reset}`;
}

export function success(text: string): string {
  return `${colors.green}${text}${colors.reset}`;
}

export function header(text: string): string {
  return `\n${colors.cyan}${colors.bold}${text}${colors.reset}\n`;
}

export function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

export function moveCursorUp(lines: number = 1): void {
  process.stdout.write(`\x1b[${lines}A`);
}

export function hideCursor(): void {
  process.stdout.write('\x1b[?25l');
}

export function showCursor(): void {
  process.stdout.write('\x1b[?25h');
}

export function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}
