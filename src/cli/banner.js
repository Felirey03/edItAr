const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function printHeader() {
  const logo = `
${colors.cyan}${colors.bold}  ███████╗██████╗ ██╗████████╗ █████╗ ██████╗ 
  ██╔════╝██╔══██╗██║╚══██╔══╝██╔══██╗██╔══██╗
  █████╗  ██║  ██║██║   ██║   ███████║██████╔╝
  ██╔══╝  ██║  ██║██║   ██║   ██╔══██║██╔══██╗
  ███████╗██████╔╝██║   ██║   ██║  ██║██║  ██║
  ╚══════╝╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝${colors.reset}
  ${colors.dim}Visual Dev-Editor for React & Next.js (0-Token Visual to Code)${colors.reset}
`;
  console.log(logo);
}

function printStep(message, status = 'success') {
  if (status === 'success') {
    console.log(` ${colors.green}✔${colors.reset} ${message}`);
  } else if (status === 'info' || status === 'skipped') {
    console.log(` ${colors.yellow}ℹ${colors.reset} ${message}`);
  } else if (status === 'error') {
    console.log(` ${colors.red}✖${colors.reset} ${message}`);
  } else {
    console.log(` ${colors.cyan}•${colors.reset} ${message}`);
  }
}

function printSuccess(message) {
  printStep(message, 'success');
}

function printInfo(message) {
  printStep(message, 'info');
}

function printError(message) {
  printStep(message, 'error');
}

function printCompletionInstructions(details = {}) {
  console.log(`\n${colors.bold}${colors.cyan}🎉 edItAr initialization complete!${colors.reset}`);
  console.log(`${colors.gray}──────────────────────────────────────────────────${colors.reset}`);
  if (details.framework) {
    console.log(`  ${colors.bold}Framework:${colors.reset} ${details.framework}`);
  }
  if (details.layoutPath) {
    console.log(`  ${colors.bold}Layout:${colors.reset} ${details.layoutPath}`);
  }
  if (details.babelConfigPath) {
    console.log(`  ${colors.bold}Babel Config:${colors.reset} ${details.babelConfigPath}`);
  }
  console.log(`\n${colors.bold}Next steps:${colors.reset}`);
  console.log(`  1. Start edItAr visual editor: ${colors.cyan}npx editar${colors.reset} (or ${colors.cyan}npx editar start${colors.reset})`);
  console.log(`  2. Start your dev server (e.g., ${colors.cyan}npm run dev${colors.reset})`);
  console.log(`  3. Open ${colors.cyan}http://localhost:8080${colors.reset} to edit visually!\n`);
}

function printHelp() {
  printHeader();
  console.log(`${colors.bold}Usage:${colors.reset} npx editar [command] [options]\n`);
  console.log(`${colors.bold}Commands:${colors.reset}`);
  console.log(`  ${colors.cyan}init${colors.reset}       Auto-configure edItAr for current project (Babel & script tag)`);
  console.log(`  ${colors.cyan}start${colors.reset}      Start edItAr visual dev server (default command)`);
  console.log(`  ${colors.cyan}--help, -h${colors.reset} Display help information`);
  console.log(`  ${colors.cyan}--version, -v${colors.reset} Display edItAr version\n`);
}

module.exports = {
  printHeader,
  printStep,
  printSuccess,
  printInfo,
  printError,
  printCompletionInstructions,
  printHelp,
  colors
};
