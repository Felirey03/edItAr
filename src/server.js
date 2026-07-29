const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const recast = require('recast');
const parser = require('@babel/parser');
const babelParser = {
  parse(code) {
    return parser.parse(code, {
      sourceType: 'module',
      tokens: true,
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
        'exportDefaultFrom'
      ]
    });
  }
};
const traverse = require('@babel/traverse').default;

const rateLimit = require('express-rate-limit');
const b = recast.types.builders;

const app = express();
const PORT = process.env.PORT || 8080;
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();

// CORS restricted to EDITOR_ALLOWED_ORIGINS
const EDITOR_ALLOWED_ORIGINS = (process.env.EDITOR_ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (EDITOR_ALLOWED_ORIGINS.length === 0 || EDITOR_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy violation: Origin not allowed'));
  }
};

app.use(cors(corsOptions));

// Rate Limiting (100 req / 15 min per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', apiLimiter);

// Payload size limit (100kb max)
app.use(bodyParser.json({ limit: '100kb' }));

// Secret validation middleware
const requireEditorSecret = (req, res, next) => {
  const secretEnv = process.env.EDITOR_SECRET;

  if (process.env.NODE_ENV === 'production' && !secretEnv) {
    return res.status(403).json({ error: 'Server misconfiguration: EDITOR_SECRET is required in production' });
  }

  if (secretEnv) {
    const providedSecret = req.headers['x-editor-secret'];
    if (!providedSecret || providedSecret !== secretEnv) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-editor-secret header' });
    }
  }

  next();
};

// Helper for file backups before write operations
const createBackup = (absolutePath) => {
  try {
    const backupDir = path.join(WORKSPACE_PATH, '.editar-backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.basename(absolutePath);
    const backupPath = path.join(backupDir, `${timestamp}_${filename}`);
    fs.copyFileSync(absolutePath, backupPath);
  } catch (err) {
    console.error('Failed to create backup:', err);
  }
};

// Serve static frontend build if it exists
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve editar-client.js (and visualdev-client.js alias) for injection into client apps
app.get(['/editar-client.js', '/visualdev-client.js'], (req, res) => {
  res.sendFile(path.join(__dirname, 'client.js'));
});


// Helper to identify sensitive/secret files or hidden folders to block completely
const isSensitiveFile = (filename, relativePath = '') => {
  const lowerName = filename.toLowerCase();
  const lowerPath = relativePath.toLowerCase();

  // Hidden files and folders starting with '.'
  if (lowerName.startsWith('.')) return true;

  // Sensitive folder paths
  const blockedDirs = [
    'node_modules', '.git', '.next', 'dist', 'out', '.gemini', '.atl', '.agents',
    '.vscode', '.idea', '.editar-backups', 'coverage'
  ];
  const pathParts = lowerPath.split('/');
  if (pathParts.some(part => blockedDirs.includes(part))) return true;

  // Environment, credential, and log files
  if (
    lowerName.includes('.env') || 
    lowerName.endsWith('.key') || 
    lowerName.endsWith('.pem') || 
    lowerName.endsWith('.secret') ||
    lowerName.endsWith('.log')
  ) {
    return true;
  }

  // System, lock files and project root manifest configs
  if (['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'tsconfig.json'].includes(lowerName)) {
    return true;
  }

  // Config files not intended for direct visual UI editing
  if (
    (lowerName.endsWith('.config.js') || lowerName.endsWith('.config.mjs') || lowerName.endsWith('.config.cjs')) &&
    !lowerName.includes('tailwind')
  ) {
    return true;
  }

  return false;
};

// Helper to check if file is an editable UI code file
const isEditableUIFile = (filename, relativePath = '') => {
  if (isSensitiveFile(filename, relativePath)) return false;
  const ext = path.extname(filename).toLowerCase();
  return ['.js', '.jsx', '.ts', '.tsx', '.css', '.html'].includes(ext);
};

// GET /api/tailwind-config - Parse project tailwind config for custom theme tokens
app.get('/api/tailwind-config', requireEditorSecret, (req, res) => {
  try {
    const candidates = [
      'tailwind.config.js',
      'tailwind.config.cjs',
      'tailwind.config.mjs',
      'demo-app/tailwind.config.js',
      'demo-app/tailwind.config.cjs',
      'demo-app/tailwind.config.mjs'
    ];

    let targetPath = null;
    for (const rel of candidates) {
      const full = path.join(WORKSPACE_PATH, rel);
      if (fs.existsSync(full)) {
        targetPath = full;
        break;
      }
    }

    if (!targetPath) {
      return res.json({
        success: true,
        hasCustomConfig: false,
        theme: { colors: {}, spacing: {}, fontFamily: {} }
      });
    }

    const code = fs.readFileSync(targetPath, 'utf8');
    const ast = recast.parse(code, { parser: babelParser });

    const themeObj = {
      colors: {},
      spacing: {},
      fontFamily: {}
    };

    const extractObjectProperties = (objExpression, targetStore) => {
      if (!objExpression || objExpression.type !== 'ObjectExpression') return;
      objExpression.properties.forEach((prop) => {
        if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') return;
        const key = prop.key.name || prop.key.value;
        if (!key) return;

        let val = null;
        if (prop.value.type === 'StringLiteral' || prop.value.type === 'Literal') {
          val = prop.value.value;
        } else if (prop.value.type === 'ArrayExpression') {
          val = prop.value.elements
            .filter(el => el && (el.type === 'StringLiteral' || el.type === 'Literal'))
            .map(el => el.value);
        } else if (prop.value.type === 'ObjectExpression') {
          // Flatten nested color objects, e.g. brand: { primary: '#3b82f6' } -> brand-primary
          const nested = {};
          prop.value.properties.forEach(sub => {
            if (sub.type === 'Property' || sub.type === 'ObjectProperty') {
              const subKey = sub.key.name || sub.key.value;
              if (subKey && (sub.value.type === 'StringLiteral' || sub.value.type === 'Literal')) {
                nested[subKey] = sub.value.value;
              }
            }
          });
          if (Object.keys(nested).length > 0) {
            val = nested;
          }
        }

        if (val !== null) {
          targetStore[key] = val;
        }
      });
    };

    const processThemeNode = (node) => {
      if (!node || node.type !== 'ObjectExpression') return;
      node.properties.forEach((prop) => {
        if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') return;
        const key = prop.key.name || prop.key.value;
        if (key === 'extend' && prop.value.type === 'ObjectExpression') {
          prop.value.properties.forEach((extendProp) => {
            if (extendProp.type !== 'Property' && extendProp.type !== 'ObjectProperty') return;
            const extKey = extendProp.key.name || extendProp.key.value;
            if (['colors', 'spacing', 'fontFamily'].includes(extKey)) {
              extractObjectProperties(extendProp.value, themeObj[extKey]);
            }
          });
        } else if (['colors', 'spacing', 'fontFamily'].includes(key)) {
          extractObjectProperties(prop.value, themeObj[key]);
        }
      });
    };

    traverse(ast, {
      AssignmentExpression(pathNode) {
        // module.exports = { theme: ... }
        const left = pathNode.node.left;
        if (
          left.type === 'MemberExpression' &&
          left.object.name === 'module' &&
          left.property.name === 'exports' &&
          pathNode.node.right.type === 'ObjectExpression'
        ) {
          const exportObj = pathNode.node.right;
          exportObj.properties.forEach((prop) => {
            if (prop.type === 'Property' || prop.type === 'ObjectProperty') {
              const key = prop.key.name || prop.key.value;
              if (key === 'theme') {
                processThemeNode(prop.value);
              }
            }
          });
        }
      },
      ExportDefaultDeclaration(pathNode) {
        // export default { theme: ... }
        const decl = pathNode.node.declaration;
        if (decl && decl.type === 'ObjectExpression') {
          decl.properties.forEach((prop) => {
            if (prop.type === 'Property' || prop.type === 'ObjectProperty') {
              const key = prop.key.name || prop.key.value;
              if (key === 'theme') {
                processThemeNode(prop.value);
              }
            }
          });
        }
      }
    });

    res.json({
      success: true,
      hasCustomConfig: true,
      theme: themeObj
    });
  } catch (error) {
    console.error('Error reading tailwind config:', error);
    res.json({
      success: true,
      hasCustomConfig: false,
      warning: error.message,
      theme: { colors: {}, spacing: {}, fontFamily: {} }
    });
  }
});


// GET /api/files - recursively scan project directory for editable UI files
app.get('/api/files', requireEditorSecret, (req, res) => {
  try {
    const listFiles = (dir, rootDir = dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

        if (isSensitiveFile(file, relativePath)) {
          return;
        }

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          results = results.concat(listFiles(fullPath, rootDir));
        } else if (isEditableUIFile(file, relativePath)) {
          results.push({
            name: file,
            path: relativePath,
            size: stat.size,
            isText: true
          });
        }
      });
      return results;
    };

    const files = listFiles(WORKSPACE_PATH);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to resolve paths relative to workspace, checking demo-app subfolder if needed
const resolveFilePath = (file) => {
  if (!file) {
    const err = new Error('File path is required');
    err.statusCode = 400;
    throw err;
  }

  let absolutePath = path.resolve(WORKSPACE_PATH, file);
  if (!fs.existsSync(absolutePath)) {
    const demoPath = path.resolve(WORKSPACE_PATH, 'demo-app', file);
    if (fs.existsSync(demoPath)) {
      absolutePath = demoPath;
    }
  }

  if (!fs.existsSync(absolutePath)) {
    const err = new Error(`File not found: ${file}`);
    err.statusCode = 404;
    throw err;
  }

  // Obtain real paths to prevent symlink traversal and TOCTOU
  const realWorkspace = fs.realpathSync(WORKSPACE_PATH);
  const realTarget = fs.realpathSync(absolutePath);

  const isInside = realTarget === realWorkspace || realTarget.startsWith(realWorkspace + path.sep);
  if (!isInside) {
    const err = new Error('Access denied: Out of workspace bounds');
    err.statusCode = 403;
    throw err;
  }

  // Block access to sensitive files
  const filename = path.basename(realTarget);
  const relativePath = path.relative(realWorkspace, realTarget).replace(/\\/g, '/');
  if (isSensitiveFile(filename, relativePath)) {
    const err = new Error('Access denied: Sensitive file access blocked');
    err.statusCode = 403;
    throw err;
  }

  return realTarget;
};

// POST /api/read - read file content
app.post('/api/read', requireEditorSecret, (req, res) => {
  const { file } = req.body;
  if (!file) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const absolutePath = resolveFilePath(file);
    const content = fs.readFileSync(absolutePath, 'utf8');
    res.json({ content });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message });
  }
});

// Centralized AST analysis helpers for checking dynamic nodes
const checkClassNameIsDynamic = (classNameAttr) => {
  if (!classNameAttr || !classNameAttr.value) {
    return { isDynamic: false };
  }
  const { value } = classNameAttr;
  if (value.type === 'StringLiteral' || (value.type === 'Literal' && typeof value.value === 'string')) {
    return { isDynamic: false };
  }
  if (value.type === 'JSXExpressionContainer') {
    const expr = value.expression;
    if (!expr) {
      return { isDynamic: false };
    }
    if (expr.type === 'TemplateLiteral') {
      const hasNoExpressions = !expr.expressions || expr.expressions.length === 0;
      const singleQuasi = expr.quasis && expr.quasis.length === 1;
      if (singleQuasi && hasNoExpressions) {
        return { isDynamic: false };
      }
    }
    if (expr.type === 'StringLiteral' || (expr.type === 'Literal' && typeof expr.value === 'string')) {
      return { isDynamic: false };
    }
    return { isDynamic: true, reason: 'className contains dynamic expression' };
  }
  return { isDynamic: true, reason: 'className is dynamic' };
};

const checkChildrenAreDynamic = (children) => {
  if (!children || children.length === 0) {
    return { isDynamic: false };
  }
  for (const child of children) {
    if (child.type !== 'JSXText') {
      return { isDynamic: true, reason: 'children contain dynamic expression or nested elements' };
    }
  }
  return { isDynamic: false };
};

const findJSXElementAtCoordinates = (absolutePath, line, column) => {
  const code = fs.readFileSync(absolutePath, 'utf8');
  const ast = recast.parse(code, {
    parser: babelParser
  });

  let targetNode = null;
  let minDistance = Infinity;

  traverse(ast, {
    JSXElement(jsxPath) {
      const openingEl = jsxPath.node.openingElement;
      const { loc } = openingEl;
      if (!loc) return;

      if (loc.start.line === parseInt(line)) {
        const distance = Math.abs(loc.start.column - (parseInt(column) - 1));
        if (distance < minDistance) {
          minDistance = distance;
          targetNode = jsxPath.node;
        }
      }
    }
  });

  return { targetNode, ast };
};

// POST /api/analyze-element - proactive static analysis of dynamic elements
app.post('/api/analyze-element', requireEditorSecret, (req, res) => {
  const { file, line, column } = req.body;

  if (!file || !line || !column) {
    return res.status(400).json({ 
      error: 'Missing required parameters (file, line, column)' 
    });
  }

  try {
    const absolutePath = resolveFilePath(file);
    const { targetNode } = findJSXElementAtCoordinates(absolutePath, line, column);

    if (!targetNode) {
      return res.status(404).json({ 
        success: false,
        error: `Could not find JSX element on line ${line} in file ${file}` 
      });
    }

    const openingEl = targetNode.openingElement;
    const classNameAttr = openingEl.attributes.find(
      attr => attr.name && attr.name.name === 'className'
    );

    const classCheck = checkClassNameIsDynamic(classNameAttr);
    const childrenCheck = checkChildrenAreDynamic(targetNode.children);

    res.json({
      success: true,
      isClassNameDynamic: classCheck.isDynamic,
      isTextDynamic: childrenCheck.isDynamic
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error('Analyze Element Error:', error);
    res.status(status).json({ error: error.message });
  }
});

// POST /api/edit-style - AST manipulation to update element className and text
app.post('/api/edit-style', requireEditorSecret, (req, res) => {
  const { file, line, column, newClasses, newText } = req.body;

  if (!file || !line || !column) {
    return res.status(400).json({ 
      error: 'Missing required parameters (file, line, column)' 
    });
  }

  try {
    const absolutePath = resolveFilePath(file);
    const { targetNode, ast } = findJSXElementAtCoordinates(absolutePath, line, column);

    if (!targetNode) {
      return res.status(404).json({ 
        error: `Could not find JSX element on line ${line} in file ${file}` 
      });
    }

    const openingEl = targetNode.openingElement;
    const classNameAttr = openingEl.attributes.find(
      attr => attr.name && attr.name.name === 'className'
    );

    // Safeguard validations
    if (newClasses !== undefined) {
      const classCheck = checkClassNameIsDynamic(classNameAttr);
      if (classCheck.isDynamic) {
        return res.status(422).json({
          success: false,
          safeguardTriggered: true,
          reason: classCheck.reason
        });
      }
    }

    if (newText !== undefined) {
      const childrenCheck = checkChildrenAreDynamic(targetNode.children);
      if (childrenCheck.isDynamic) {
        return res.status(422).json({
          success: false,
          safeguardTriggered: true,
          reason: childrenCheck.reason
        });
      }
    }

    // 1. Update classes if provided using recast.types.builders
    if (newClasses !== undefined) {
      if (classNameAttr) {
        if (classNameAttr.value && classNameAttr.value.type === 'StringLiteral') {
          classNameAttr.value.value = newClasses;
        } else if (classNameAttr.value && classNameAttr.value.type === 'JSXExpressionContainer') {
          const expr = classNameAttr.value.expression;
          if (expr.type === 'TemplateLiteral' && expr.quasis && expr.quasis.length === 1) {
            expr.quasis[0].value.raw = newClasses;
            expr.quasis[0].value.cooked = newClasses;
          } else {
            // Override with simple string literal using builder
            classNameAttr.value = b.stringLiteral(newClasses);
          }
        } else {
          // Fallback using builder
          classNameAttr.value = b.stringLiteral(newClasses);
        }
      } else {
        // Create new className attribute using builder
        openingEl.attributes.push(
          b.jsxAttribute(
            b.jsxIdentifier('className'),
            b.stringLiteral(newClasses)
          )
        );
      }
    }

    // 2. Update text content if provided using recast.types.builders
    if (newText !== undefined) {
      targetNode.children = [
        b.jsxText(newText)
      ];

      // Convert self-closing tags to tags with closing tags (e.g. <div /> -> <div>text</div>)
      if (openingEl.selfClosing) {
        openingEl.selfClosing = false;
        targetNode.closingElement = b.jsxClosingElement(openingEl.name);
      }
    }

    // Generate output code keeping format intact
    const { code: outputCode } = recast.print(ast);

    // Pre-validate AST parsing with @babel/parser before writing
    try {
      babelParser.parse(outputCode);
    } catch (parseError) {
      return res.status(400).json({
        error: `AST syntax pre-validation failed: ${parseError.message}`
      });
    }

    // Create backup prior to modifying file
    createBackup(absolutePath);

    // Save changes to disk
    fs.writeFileSync(absolutePath, outputCode, 'utf8');

    res.json({ success: true, message: 'Element updated successfully' });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error('AST Edit Error:', error);
    res.status(status).json({ error: error.message });
  }
});

// Fallback to serve index.html for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Visual Editor frontend not built. Run npm build inside editor folder.');
  }
});

app.listen(PORT, () => {
  console.log(`[edItAr Server] Running on port ${PORT}`);
  console.log(`[edItAr Server] Workspace path: ${WORKSPACE_PATH}`);
});
