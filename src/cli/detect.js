const fs = require('fs');
const path = require('path');

function detectProject(targetDir = process.cwd()) {
  const absoluteDir = path.resolve(targetDir);

  const possibleAppLayouts = [
    'app/layout.tsx',
    'app/layout.jsx',
    'app/layout.js',
    'app/layout.ts',
    'src/app/layout.tsx',
    'src/app/layout.jsx',
    'src/app/layout.js',
    'src/app/layout.ts'
  ];

  const possiblePagesLayouts = [
    'pages/_document.tsx',
    'pages/_document.jsx',
    'pages/_document.js',
    'pages/_document.ts',
    'src/pages/_document.tsx',
    'src/pages/_document.jsx',
    'src/pages/_document.js',
    'src/pages/_document.ts',
    'pages/_app.tsx',
    'pages/_app.jsx',
    'pages/_app.js',
    'pages/_app.ts',
    'src/pages/_app.tsx',
    'src/pages/_app.jsx',
    'src/pages/_app.js',
    'src/pages/_app.ts'
  ];

  const possibleViteLayouts = [
    'index.html',
    'public/index.html',
    'src/index.html'
  ];

  let framework = 'unknown';
  let layoutPath = null;

  for (const relPath of possibleAppLayouts) {
    const fullPath = path.join(absoluteDir, relPath);
    if (fs.existsSync(fullPath)) {
      framework = 'next-app';
      layoutPath = fullPath;
      break;
    }
  }

  if (!layoutPath) {
    for (const relPath of possiblePagesLayouts) {
      const fullPath = path.join(absoluteDir, relPath);
      if (fs.existsSync(fullPath)) {
        framework = 'next-pages';
        layoutPath = fullPath;
        break;
      }
    }
  }

  if (!layoutPath) {
    for (const relPath of possibleViteLayouts) {
      const fullPath = path.join(absoluteDir, relPath);
      if (fs.existsSync(fullPath)) {
        framework = 'vite';
        layoutPath = fullPath;
        break;
      }
    }
  }

  const babelConfigs = [
    'babel.config.js',
    'babel.config.cjs',
    'babel.config.mjs',
    'babel.config.json',
    '.babelrc',
    '.babelrc.json',
    '.babelrc.js'
  ];

  let hasBabelConfig = false;
  let babelConfigPath = null;

  for (const configFile of babelConfigs) {
    const fullPath = path.join(absoluteDir, configFile);
    if (fs.existsSync(fullPath)) {
      hasBabelConfig = true;
      babelConfigPath = fullPath;
      break;
    }
  }

  return {
    framework,
    layoutPath,
    hasBabelConfig,
    babelConfigPath
  };
}

module.exports = {
  detectProject
};
