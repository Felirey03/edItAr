const fs = require('fs');
const path = require('path');

function configureNext(targetDir = process.cwd(), nextConfigPath) {
  if (!nextConfigPath || !fs.existsSync(nextConfigPath)) {
    return { action: 'skipped', configPath: null };
  }

  const content = fs.readFileSync(nextConfigPath, 'utf8');

  // Check if already configured
  if (
    content.includes('withEditar') ||
    content.includes('editar/next') ||
    content.includes('webpack-loader')
  ) {
    return { action: 'already-configured', configPath: nextConfigPath };
  }

  const isMjs = nextConfigPath.endsWith('.mjs');
  // Resolve absolute path to src/next.js using forward slashes
  const wrapperPath = path.resolve(__dirname, '../next.js').replace(/\\/g, '/');

  let updatedContent = content;

  if (isMjs) {
    const importStatement = `import withEditar from '${wrapperPath}';\n`;
    if (/export\s+default\s+/.test(content)) {
      updatedContent = importStatement + content.replace(
        /export\s+default\s+([\s\S]+?)(;?\s*)$/,
        (match, p1, p2) => {
          let cleaned = p1.trim();
          let semi = p2 || '';
          if (cleaned.endsWith(';')) {
            cleaned = cleaned.slice(0, -1);
            semi = ';';
          }
          return `export default withEditar(${cleaned})${semi}`;
        }
      );
    } else {
      updatedContent = importStatement + content + `\nexport default withEditar({});\n`;
    }
  } else {
    const requireStatement = `const withEditar = require('${wrapperPath}');\n`;
    if (/module\.exports\s*=\s*/.test(content)) {
      updatedContent = requireStatement + content.replace(
        /module\.exports\s*=\s*([\s\S]+?)(;?\s*)$/,
        (match, p1, p2) => {
          let cleaned = p1.trim();
          let semi = p2 || '';
          if (cleaned.endsWith(';')) {
            cleaned = cleaned.slice(0, -1);
            semi = ';';
          }
          return `module.exports = withEditar(${cleaned})${semi}`;
        }
      );
    } else {
      updatedContent = requireStatement + content + `\nmodule.exports = withEditar({});\n`;
    }
  }

  fs.writeFileSync(nextConfigPath, updatedContent, 'utf8');

  return {
    action: 'updated',
    configPath: nextConfigPath
  };
}

function cleanBabelConfigs(targetDir = process.cwd()) {
  const absoluteDir = path.resolve(targetDir);
  const possibleConfigs = [
    'babel.config.js',
    'babel.config.cjs',
    'babel.config.mjs',
    'babel.config.json',
    '.babelrc',
    '.babelrc.json',
    '.babelrc.js'
  ];

  const cleaned = [];

  for (const file of possibleConfigs) {
    const fullPath = path.join(absoluteDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (
        content.includes('editar/babel-plugin') ||
        content.includes('editar/src/babel-plugin') ||
        content.includes('src/babel-plugin.js')
      ) {
        fs.unlinkSync(fullPath);
        cleaned.push(fullPath);
      }
    }
  }

  return cleaned;
}

module.exports = {
  configureNext,
  cleanBabelConfigs
};
