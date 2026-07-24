const fs = require('fs');
const path = require('path');

function configureBabel(targetDir = process.cwd(), framework = 'next-app') {
  const absoluteDir = path.resolve(targetDir);

  const possibleConfigs = [
    'babel.config.js',
    'babel.config.cjs',
    'babel.config.json',
    '.babelrc',
    '.babelrc.json',
    '.babelrc.js'
  ];

  let configPath = null;
  for (const file of possibleConfigs) {
    const fullPath = path.join(absoluteDir, file);
    if (fs.existsSync(fullPath)) {
      configPath = fullPath;
      break;
    }
  }

  const pluginName = 'editar/babel-plugin';

  if (!configPath) {
    const defaultPath = path.join(absoluteDir, 'babel.config.js');
    const isNext = framework === 'next-app' || framework === 'next-pages';
    const presets = isNext ? "presets: ['next/babel'],\n  " : '';

    const content = `module.exports = {
  ${presets}plugins: [
    '${pluginName}'
  ]
};\n`;

    fs.writeFileSync(defaultPath, content, 'utf8');
    return {
      action: 'created',
      configPath: defaultPath
    };
  }

  const content = fs.readFileSync(configPath, 'utf8');

  if (
    content.includes('editar/babel-plugin') ||
    content.includes('editar/src/babel-plugin') ||
    content.includes('src/babel-plugin.js')
  ) {
    return {
      action: 'already-configured',
      configPath
    };
  }

  const isJson = configPath.endsWith('.json') || path.basename(configPath) === '.babelrc';

  if (isJson) {
    try {
      const json = JSON.parse(content);
      if (!Array.isArray(json.plugins)) {
        json.plugins = [];
      }
      json.plugins.push(pluginName);
      fs.writeFileSync(configPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      return {
        action: 'updated',
        configPath
      };
    } catch (e) {
      throw new Error(`Failed to parse Babel JSON config at ${configPath}: ${e.message}`);
    }
  }

  // JS config file (babel.config.js, babel.config.cjs, .babelrc.js)
  let updatedContent = content;
  if (/plugins\s*:\s*\[/.test(content)) {
    updatedContent = content.replace(
      /(plugins\s*:\s*\[)/,
      `$1\n    '${pluginName}',`
    );
  } else if (/module\.exports\s*=\s*\{/.test(content)) {
    updatedContent = content.replace(
      /(module\.exports\s*=\s*\{)/,
      `$1\n  plugins: ['${pluginName}'],`
    );
  } else if (/export\default\s*\{/.test(content)) {
    updatedContent = content.replace(
      /(export\default\s*\{)/,
      `$1\n  plugins: ['${pluginName}'],`
    );
  } else {
    updatedContent = content + `\n// edItAr Babel Plugin\nif (module && module.exports) {\n  module.exports.plugins = module.exports.plugins || [];\n  module.exports.plugins.push('${pluginName}');\n}\n`;
  }

  fs.writeFileSync(configPath, updatedContent, 'utf8');
  return {
    action: 'updated',
    configPath
  };
}

module.exports = {
  configureBabel
};
