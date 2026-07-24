const path = require('path');
const banner = require('./banner');
const { detectProject } = require('./detect');
const { configureBabel } = require('./configure-babel');
const { injectClientScript } = require('./inject-script');

async function run(cwd = process.cwd()) {
  banner.printHeader();

  const detection = detectProject(cwd);
  const relLayout = detection.layoutPath ? path.relative(cwd, detection.layoutPath) : null;

  if (detection.framework === 'next-app') {
    banner.printSuccess(`Detected Next.js App Router (${relLayout || 'app/layout'})`);
  } else if (detection.framework === 'next-pages') {
    banner.printSuccess(`Detected Next.js Pages Router (${relLayout || 'pages/_document'})`);
  } else if (detection.framework === 'vite') {
    banner.printSuccess(`Detected Vite / HTML project (${relLayout || 'index.html'})`);
  } else {
    banner.printInfo('Framework detection: Unknown layout pattern, will configure generic Babel & search files.');
  }

  // Configure Babel
  const babelResult = configureBabel(cwd, detection.framework);
  const relBabel = path.relative(cwd, babelResult.configPath);

  if (babelResult.action === 'created') {
    banner.printSuccess(`Created ${relBabel} with editar/babel-plugin`);
  } else if (babelResult.action === 'updated') {
    banner.printSuccess(`Added editar/babel-plugin to ${relBabel}`);
  } else if (babelResult.action === 'already-configured') {
    banner.printInfo(`Babel plugin already configured in ${relBabel}`);
  }

  // Inject Script
  let scriptResult = { action: 'skipped', targetPath: null };
  if (detection.layoutPath) {
    scriptResult = injectClientScript(detection.layoutPath);
    if (scriptResult.action === 'injected') {
      banner.printSuccess(`Injected client script tag into ${relLayout}`);
    } else if (scriptResult.action === 'already-injected') {
      banner.printInfo(`Client script tag already present in ${relLayout}`);
    } else if (scriptResult.action === 'failed') {
      banner.printError(`Could not inject client script: ${scriptResult.error}`);
    }
  } else {
    banner.printInfo('No layout or index.html found to inject script tag automatically.');
  }

  banner.printCompletionInstructions({
    framework: detection.framework,
    layoutPath: relLayout,
    babelConfigPath: relBabel
  });

  return {
    detection,
    babelResult,
    scriptResult
  };
}

module.exports = {
  run
};
