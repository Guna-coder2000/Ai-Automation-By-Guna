/**
 * Console UI utilities — beautiful, colored, emoji-rich output
 * for the AI-Playwright pipeline. Makes terminal output
 * instantly readable during demos.
 */

// ─── ANSI Color codes ──────────────────────────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const FG_RED = '\x1b[31m';
const FG_GREEN = '\x1b[32m';
const FG_YELLOW = '\x1b[33m';
const FG_BLUE = '\x1b[34m';
const FG_MAGENTA = '\x1b[35m';
const FG_CYAN = '\x1b[36m';
const FG_WHITE = '\x1b[37m';

const BG_GREEN = '\x1b[42m';
const BG_RED = '\x1b[41m';
const BG_BLUE = '\x1b[44m';
const BG_MAGENTA = '\x1b[45m';
const BG_CYAN = '\x1b[46m';
const BG_YELLOW = '\x1b[43m';

// ─── Stage Colors ───────────────────────────────────────────────────

const STAGE_COLORS: Record<number, { bg: string; fg: string; icon: string }> = {
  1: { bg: BG_BLUE, fg: FG_BLUE, icon: '📋' },
  2: { bg: BG_MAGENTA, fg: FG_MAGENTA, icon: '⚙️' },
  3: { bg: BG_CYAN, fg: FG_CYAN, icon: '🚀' },
  4: { bg: BG_YELLOW, fg: FG_YELLOW, icon: '🔧' },
  5: { bg: BG_GREEN, fg: FG_GREEN, icon: '📊' },
};

// ─── Helpers ────────────────────────────────────────────────────────

function line(char = '─', length = 70): string {
  return char.repeat(length);
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Print the big pipeline header when the full run starts.
 */
export function pipelineHeader(requestFile: string): void {
  const fileName = requestFile.split(/[/\\]/).pop() || requestFile;
  console.log('');
  console.log(`${BOLD}${FG_CYAN}${line('═')}${RESET}`);
  console.log(`${BOLD}${FG_CYAN}  🤖  AI-PLAYWRIGHT AUTOMATION PIPELINE${RESET}`);
  console.log(`${BOLD}${FG_CYAN}${line('═')}${RESET}`);
  console.log(`${DIM}${FG_WHITE}  Request : ${fileName}${RESET}`);
  console.log(`${DIM}${FG_WHITE}  Time    : ${new Date().toLocaleTimeString()}${RESET}`);
  console.log(`${BOLD}${FG_CYAN}${line('─')}${RESET}`);
  console.log('');
}

/**
 * Print a stage start banner.
 */
export function stageStart(stageNum: number, name: string, description: string): void {
  const colors = STAGE_COLORS[stageNum] || STAGE_COLORS[1];
  console.log('');
  console.log(`${BOLD}${colors.fg}${line('─')}${RESET}`);
  console.log(`${BOLD}${colors.bg}${FG_WHITE}  STAGE ${stageNum}  ${RESET} ${BOLD}${colors.fg} ${colors.icon}  ${name}${RESET}`);
  console.log(`${DIM}${FG_WHITE}  ${description}${RESET}`);
  console.log(`${BOLD}${colors.fg}${line('─')}${RESET}`);
}

/**
 * Print a stage success message.
 */
export function stagePass(stageNum: number, name: string, detail: string): void {
  const colors = STAGE_COLORS[stageNum] || STAGE_COLORS[1];
  console.log(`${BOLD}${FG_GREEN}  ✅ ${name} completed successfully${RESET}`);
  console.log(`${DIM}${FG_WHITE}     ${detail}${RESET}`);
  console.log('');
}

/**
 * Print a stage failure message.
 */
export function stageFail(stageNum: number, name: string, detail: string): void {
  console.log(`${BOLD}${FG_RED}  ❌ ${name} FAILED${RESET}`);
  console.log(`${DIM}${FG_RED}     ${detail}${RESET}`);
  console.log('');
}

/**
 * Print a divider line.
 */
export function divider(): void {
  console.log(`${DIM}${FG_WHITE}${line('·')}${RESET}`);
}

/**
 * Print a colored banner message.
 */
export function banner(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const colorMap = {
    info: FG_CYAN,
    success: FG_GREEN,
    error: FG_RED,
    warn: FG_YELLOW,
  };
  console.log(`${BOLD}${colorMap[type]}${message}${RESET}`);
}

export function executionLog(
  type: 'info' | 'action' | 'success' | 'warn' | 'error' | 'heal' | 'skip',
  title: string,
  detail = ''
): void {
  const colorMap = {
    info: FG_CYAN,
    action: FG_MAGENTA,
    success: FG_GREEN,
    warn: FG_YELLOW,
    error: FG_RED,
    heal: FG_BLUE,
    skip: FG_YELLOW,
  };
  const labelMap = {
    info: 'EXEC',
    action: 'ACTION',
    success: 'PASS',
    warn: 'WARN',
    error: 'FAIL',
    heal: 'HEAL',
    skip: 'SKIP',
  };
  const color = colorMap[type];
  const label = labelMap[type];
  const suffix = detail ? `${DIM}${FG_WHITE} - ${detail}${RESET}` : '';
  console.log(`${BOLD}${color}[${label}] ${title}${RESET}${suffix}`);
}

/**
 * Print the final pipeline summary with pass/fail and timing.
 */
export function pipelineSummary(passed: boolean, elapsedSeconds: string): void {
  console.log('');
  console.log(`${BOLD}${FG_CYAN}${line('═')}${RESET}`);
  if (passed) {
    console.log(`${BOLD}${BG_GREEN}${FG_WHITE}  ✅  PIPELINE PASSED  ${RESET}  ${FG_GREEN}All stages completed successfully${RESET}`);
  } else {
    console.log(`${BOLD}${BG_RED}${FG_WHITE}  ❌  PIPELINE FAILED  ${RESET}  ${FG_RED}One or more stages failed${RESET}`);
  }
  console.log(`${DIM}${FG_WHITE}  Total time: ${elapsedSeconds}s${RESET}`);
  const cwd = process.cwd().replace(/\\/g, '/');
  console.log(`${DIM}${FG_WHITE}  📂 HTML Report → file:///${cwd}/reports/html/index.html${RESET}`);
  console.log(`${DIM}${FG_WHITE}  📸 Screenshots  → file:///${cwd}/test-results/${RESET}`);
  console.log(`${DIM}${FG_WHITE}  📄 Frame Logs   → file:///${cwd}/reports/logs/framework.log${RESET}`);
  console.log(`${BOLD}${FG_CYAN}${line('═')}${RESET}`);
  console.log('');
}
