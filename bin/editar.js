#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const pkg = require('../package.json');
const banner = require('../src/cli/banner');

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'start';

if (command === '--version' || command === '-v' || command === 'version') {
  console.log(`edItAr v${pkg.version}`);
  process.exit(0);
}

if (command === '--help' || command === '-h' || command === 'help') {
  banner.printHelp();
  process.exit(0);
}

if (command === 'init') {
  const { run } = require('../src/cli/init');
  run().catch((err) => {
    console.error(`\nError executing init: ${err.message}`);
    process.exit(1);
  });
} else if (command === 'start' || args.length === 0) {
  console.log('[edItAr] Iniciando editor visual en:', process.cwd());

  const serverPath = path.join(__dirname, '../src/server.js');
  const child = spawn('node', [serverPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      WORKSPACE_PATH: process.cwd()
    }
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });
} else {
  console.error(`Error: Unknown command "${args[0]}"`);
  banner.printHelp();
  process.exit(1);
}
