#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

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
  process.exit(code);
});
