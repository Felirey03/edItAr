const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const { detectProject } = require('../src/cli/detect');
const { configureBabel } = require('../src/cli/configure-babel');
const { injectClientScript } = require('../src/cli/inject-script');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'editar-cli-test-'));
}

function removeTempDir(dir) {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('detectProject identifies Next.js App Router', () => {
  const tmp = createTempDir();
  try {
    fs.mkdirSync(path.join(tmp, 'app'), { recursive: true });
    const layoutFile = path.join(tmp, 'app', 'layout.tsx');
    fs.writeFileSync(layoutFile, 'export default function Layout({children}) { return <html><body>{children}</body></html>; }');

    const result = detectProject(tmp);
    assert.strictEqual(result.framework, 'next-app');
    assert.strictEqual(result.layoutPath, layoutFile);
    assert.strictEqual(result.hasBabelConfig, false);
  } finally {
    removeTempDir(tmp);
  }
});

test('detectProject identifies Next.js Pages Router', () => {
  const tmp = createTempDir();
  try {
    fs.mkdirSync(path.join(tmp, 'pages'), { recursive: true });
    const docFile = path.join(tmp, 'pages', '_document.jsx');
    fs.writeFileSync(docFile, 'export default function Document() { return <html><body><Main /></body></html>; }');

    const result = detectProject(tmp);
    assert.strictEqual(result.framework, 'next-pages');
    assert.strictEqual(result.layoutPath, docFile);
  } finally {
    removeTempDir(tmp);
  }
});

test('detectProject identifies Vite HTML project', () => {
  const tmp = createTempDir();
  try {
    const htmlFile = path.join(tmp, 'index.html');
    fs.writeFileSync(htmlFile, '<!DOCTYPE html><html><head></head><body></body></html>');

    const result = detectProject(tmp);
    assert.strictEqual(result.framework, 'vite');
    assert.strictEqual(result.layoutPath, htmlFile);
  } finally {
    removeTempDir(tmp);
  }
});

test('configureBabel creates babel.config.js if missing', () => {
  const tmp = createTempDir();
  try {
    const res = configureBabel(tmp, 'next-app');
    assert.strictEqual(res.action, 'created');
    assert.ok(fs.existsSync(res.configPath));

    const content = fs.readFileSync(res.configPath, 'utf8');
    assert.ok(content.includes('editar/babel-plugin'));
    assert.ok(content.includes('next/babel'));
  } finally {
    removeTempDir(tmp);
  }
});

test('configureBabel appends to existing babel.config.js and handles idempotency', () => {
  const tmp = createTempDir();
  try {
    const configPath = path.join(tmp, 'babel.config.js');
    fs.writeFileSync(configPath, `module.exports = {\n  presets: ['next/babel'],\n  plugins: ['@babel/plugin-proposal-class-properties']\n};\n`);

    const res1 = configureBabel(tmp, 'next-app');
    assert.strictEqual(res1.action, 'updated');
    const content1 = fs.readFileSync(configPath, 'utf8');
    assert.ok(content1.includes('editar/babel-plugin'));
    assert.ok(content1.includes('@babel/plugin-proposal-class-properties'));

    const res2 = configureBabel(tmp, 'next-app');
    assert.strictEqual(res2.action, 'already-configured');
  } finally {
    removeTempDir(tmp);
  }
});

test('injectClientScript injects tag into HTML/JSX idempotently', () => {
  const tmp = createTempDir();
  try {
    const htmlFile = path.join(tmp, 'index.html');
    fs.writeFileSync(htmlFile, '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>');

    const res1 = injectClientScript(htmlFile);
    assert.strictEqual(res1.action, 'injected');
    const content1 = fs.readFileSync(htmlFile, 'utf8');
    assert.ok(content1.includes('<script src="http://localhost:8080/editar-client.js" async></script>'));

    const res2 = injectClientScript(htmlFile);
    assert.strictEqual(res2.action, 'already-injected');
  } finally {
    removeTempDir(tmp);
  }
});

test('injectClientScript formats JSX self-closing script tag in React layouts', () => {
  const tmp = createTempDir();
  try {
    const layoutFile = path.join(tmp, 'layout.tsx');
    fs.writeFileSync(layoutFile, 'export default function Layout({ children }) {\n  return (\n    <html>\n      <head></head>\n      <body>{children}</body>\n    </html>\n  );\n}');

    const res = injectClientScript(layoutFile);
    assert.strictEqual(res.action, 'injected');
    const content = fs.readFileSync(layoutFile, 'utf8');
    assert.ok(content.includes('<script src="http://localhost:8080/editar-client.js" async />'));
  } finally {
    removeTempDir(tmp);
  }
});

test('bin/editar.js CLI flags (--help and --version)', () => {
  const binPath = path.join(__dirname, '../bin/editar.js');

  const helpOut = execSync(`node ${binPath} --help`).toString();
  assert.ok(helpOut.includes('Usage:'));
  assert.ok(helpOut.includes('npx editar'));
  assert.ok(helpOut.includes('init'));

  const versionOut = execSync(`node ${binPath} --version`).toString();
  assert.ok(versionOut.includes('edItAr v1.0.0'));
});

test('bin/editar.js init command integration in Vite/React workspace', () => {
  const tmp = createTempDir();
  const binPath = path.join(__dirname, '../bin/editar.js');
  try {
    const indexFile = path.join(tmp, 'index.html');
    fs.writeFileSync(indexFile, '<html><head></head><body><div id="root"></div></body></html>');

    const output = execSync(`node ${binPath} init`, { cwd: tmp }).toString();
    assert.ok(output.includes('Detected Vite / HTML project'));
    assert.ok(output.includes('Created babel.config.js'));
    assert.ok(output.includes('Injected client script tag'));

    assert.ok(fs.existsSync(path.join(tmp, 'babel.config.js')));
    const indexContent = fs.readFileSync(indexFile, 'utf8');
    assert.ok(indexContent.includes('editar-client.js'));
  } finally {
    removeTempDir(tmp);
  }
});

test('Webpack Loader transforms JS/TSX file with babel-plugin', async () => {
  const webpackLoader = require('../src/webpack-loader');
  
  const result = await new Promise((resolve, reject) => {
    const context = {
      resourcePath: '/path/to/project/src/Component.tsx',
      async() {
        return (err, code, map) => {
          if (err) reject(err);
          else resolve(code);
        };
      }
    };

    const source = `
export default function Component() {
  return (
    <div className="test">
      Hello
    </div>
  );
}
    `;

    webpackLoader.call(context, source);
  });

  assert.ok(result.includes('data-source-loc'));
  assert.ok(result.includes('src/Component.tsx:4:5'));
});

test('withEditar wraps config and appends webpack rule', () => {
  const withEditar = require('../src/next');
  
  const originalConfig = {
    reactStrictMode: true,
    webpack(config, options) {
      config.customLoaded = true;
      return config;
    }
  };

  const wrapped = withEditar(originalConfig);
  assert.strictEqual(wrapped.reactStrictMode, true);

  const webpackConfig = { module: { rules: [] } };
  const options = { dev: true, isServer: false };
  const resConfig = wrapped.webpack(webpackConfig, options);

  assert.strictEqual(resConfig.module.rules.length, 1);
  assert.ok(resConfig.module.rules[0].use[0].loader.includes('webpack-loader.js'));
  assert.strictEqual(resConfig.customLoaded, true);

  const prodWebpackConfig = { module: { rules: [] } };
  const prodResConfig = wrapped.webpack(prodWebpackConfig, { dev: false, isServer: false });
  assert.strictEqual(prodResConfig.module.rules.length, 0);
});

test('configureNext and cleanBabelConfigs operations', () => {
  const tmp = createTempDir();
  try {
    const { configureNext, cleanBabelConfigs } = require('../src/cli/configure-next');
    
    const cjsConfig = path.join(tmp, 'next.config.js');
    fs.writeFileSync(cjsConfig, 'module.exports = {\n  reactStrictMode: true\n};');
    
    const resCjs = configureNext(tmp, cjsConfig);
    assert.strictEqual(resCjs.action, 'updated');
    const contentCjs = fs.readFileSync(cjsConfig, 'utf8');
    assert.ok(contentCjs.includes('withEditar'));
    assert.ok(contentCjs.includes('module.exports = withEditar({'));

    const resCjs2 = configureNext(tmp, cjsConfig);
    assert.strictEqual(resCjs2.action, 'already-configured');

    const mjsConfig = path.join(tmp, 'next.config.mjs');
    fs.writeFileSync(mjsConfig, 'export default {\n  reactStrictMode: false\n};');

    const resMjs = configureNext(tmp, mjsConfig);
    assert.strictEqual(resMjs.action, 'updated');
    const contentMjs = fs.readFileSync(mjsConfig, 'utf8');
    assert.ok(contentMjs.includes('withEditar'));
    assert.ok(contentMjs.includes('export default withEditar({'));

    const babelConfig = path.join(tmp, 'babel.config.js');
    fs.writeFileSync(babelConfig, 'module.exports = { plugins: ["editar/babel-plugin"] };');
    assert.ok(fs.existsSync(babelConfig));

    const cleaned = cleanBabelConfigs(tmp);
    assert.strictEqual(cleaned.length, 1);
    assert.ok(!fs.existsSync(babelConfig));
  } finally {
    removeTempDir(tmp);
  }
});

test('bin/editar.js init command integrates Next.js project properly', () => {
  const tmp = createTempDir();
  const binPath = path.join(__dirname, '../bin/editar.js');
  try {
    fs.mkdirSync(path.join(tmp, 'app'), { recursive: true });
    const layoutFile = path.join(tmp, 'app', 'layout.tsx');
    fs.writeFileSync(layoutFile, 'export default function RootLayout({ children }: { children: React.ReactNode }) { return (<html><head></head><body>{children}</body></html>); }');

    const nextConfig = path.join(tmp, 'next.config.js');
    fs.writeFileSync(nextConfig, 'module.exports = {\n  reactStrictMode: true\n};');

    const babelConfig = path.join(tmp, 'babel.config.js');
    fs.writeFileSync(babelConfig, 'module.exports = { plugins: ["editar/babel-plugin"] };');

    const output = execSync(`node ${binPath} init`, { cwd: tmp }).toString();
    assert.ok(output.includes('Detected Next.js App Router'));
    assert.ok(output.includes('Removed conflicting Babel config'));
    assert.ok(output.includes('Wrapped next.config.js with withEditar'));
    assert.ok(output.includes('Injected client script tag'));

    assert.ok(!fs.existsSync(babelConfig));
    const nextContent = fs.readFileSync(nextConfig, 'utf8');
    assert.ok(nextContent.includes('withEditar'));
    const layoutContent = fs.readFileSync(layoutFile, 'utf8');
    assert.ok(layoutContent.includes('editar-client.js'));
  } finally {
    removeTempDir(tmp);
  }
});

test('App.jsx renders mode switcher with MousePointer and Sliders icons', () => {
  const appPath = path.join(__dirname, '../src/client/App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  assert.ok(appContent.includes('MousePointer'));
  assert.ok(appContent.includes('Sliders'));
  assert.ok(appContent.includes('editorMode'));
  assert.ok(appContent.includes('mode-switcher-container'));
  assert.ok(appContent.includes('mode-switcher-btn'));
  assert.ok(appContent.includes('aria-pressed={editorMode === \'edit\'}'));
  assert.ok(appContent.includes('aria-pressed={editorMode === \'navigate\'}'));
  assert.ok(appContent.includes('VISUALDEV_SET_MODE'));
  assert.ok(appContent.includes('VISUALDEV_URL_CHANGED'));
});

test('src/client.js mode switching, event bypass, and history URL sync', () => {
  const clientScriptPath = path.join(__dirname, '../src/client.js');
  const scriptContent = fs.readFileSync(clientScriptPath, 'utf8');
  
  assert.ok(scriptContent.includes('VISUALDEV_SET_MODE'));
  assert.ok(scriptContent.includes('VISUALDEV_URL_CHANGED'));
  assert.ok(scriptContent.includes('__visualdev_patched'));

  // Test execution behavior with mock DOM globals
  const listeners = {};
  const parentMessages = [];

  const mockElement = {
    style: {},
    setAttribute: () => {},
    getAttribute: (attr) => attr === 'data-source-loc' ? 'src/App.jsx:10:5' : null,
    getBoundingClientRect: () => ({ top: 10, left: 10, width: 100, height: 50 }),
    tagName: 'BUTTON',
    className: 'btn-primary',
    innerText: 'Click me',
    parentElement: null
  };

  const mockDocument = {
    body: {
      appendChild: () => {}
    },
    createElement: () => ({ style: {}, textContent: '' }),
    querySelector: () => mockElement,
    querySelectorAll: () => [mockElement],
    addEventListener: (type, fn, useCapture) => {
      listeners[type] = fn;
    },
    activeElement: null
  };

  const mockHistory = {
    pushState: function(state, title, url) { this.url = url; },
    replaceState: function(state, title, url) { this.url = url; }
  };

  const mockWindow = {
    __visualdev_injected: false,
    scrollX: 0,
    scrollY: 0,
    location: { href: 'http://localhost:3000/dashboard' },
    history: mockHistory,
    parent: {
      postMessage: (data) => parentMessages.push(data)
    },
    addEventListener: (type, fn) => {
      listeners['window_' + type] = fn;
    },
    getComputedStyle: () => ({ backgroundColor: 'red', color: 'blue' })
  };

  mockElement.parentElement = mockDocument.body;

  // Execute client script within mock context
  const runScript = new Function('window', 'document', 'console', scriptContent);
  runScript(mockWindow, mockDocument, { log: () => {} });

  assert.strictEqual(mockWindow.__visualdev_injected, true);
  assert.strictEqual(typeof listeners['window_message'], 'function');
  assert.strictEqual(mockHistory.pushState.__visualdev_patched, true);

  // 1. Test history.pushState dispatches VISUALDEV_URL_CHANGED
  mockHistory.pushState({}, '', '/new-page');
  assert.strictEqual(parentMessages.length, 1);
  assert.strictEqual(parentMessages[0].type, 'VISUALDEV_URL_CHANGED');
  assert.strictEqual(parentMessages[0].url, 'http://localhost:3000/dashboard');

  // 2. Test mode switch to navigate
  listeners['window_message']({ data: { type: 'VISUALDEV_SET_MODE', mode: 'navigate' } });

  // 3. Test click event in navigate mode (does not call preventDefault)
  let prevented = false;
  let stopped = false;
  const mockClickEvent = {
    target: mockElement,
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; }
  };
  listeners['click'](mockClickEvent);
  assert.strictEqual(prevented, false);
  assert.strictEqual(stopped, false);

  // 4. Test mode switch back to edit mode
  listeners['window_message']({ data: { type: 'VISUALDEV_SET_MODE', mode: 'edit' } });

  // 5. Test click event in edit mode (calls preventDefault & posts VISUALDEV_SELECT_ELEMENT)
  parentMessages.length = 0;
  listeners['click'](mockClickEvent);
  assert.strictEqual(prevented, true);
  assert.strictEqual(stopped, true);
  assert.strictEqual(parentMessages.length, 1);
  assert.strictEqual(parentMessages[0].type, 'VISUALDEV_SELECT_ELEMENT');
  assert.strictEqual(parentMessages[0].sourceLoc, 'src/App.jsx:10:5');
  assert.strictEqual(parentMessages[0].instanceIndex, 0);
});

test('src/client.js instanceIndex selection, payload transmission, and accurate DOM reselection with fallback', () => {
  const clientScriptPath = path.join(__dirname, '../src/client.js');
  const scriptContent = fs.readFileSync(clientScriptPath, 'utf8');

  const listeners = {};
  const parentMessages = [];

  const createMockElement = (id, className) => ({
    id,
    className,
    style: {},
    setAttribute: () => {},
    getAttribute: (attr) => attr === 'data-source-loc' ? 'src/List.jsx:15:3' : null,
    getBoundingClientRect: () => ({ top: 20, left: 20, width: 100, height: 30 }),
    tagName: 'DIV',
    innerText: `Item ${id}`,
    parentElement: null
  });

  const el0 = createMockElement('0', 'item-class');
  const el1 = createMockElement('1', 'item-class');
  const el2 = createMockElement('2', 'item-class');

  const mockDocument = {
    body: { appendChild: () => {} },
    createElement: () => ({ style: {}, textContent: '' }),
    querySelectorAll: (selector) => {
      if (selector === '[data-source-loc="src/List.jsx:15:3"]') {
        return [el0, el1, el2];
      }
      return [];
    },
    querySelector: (selector) => {
      const matches = mockDocument.querySelectorAll(selector);
      return matches[0] || null;
    },
    addEventListener: (type, fn) => {
      listeners[type] = fn;
    },
    activeElement: null
  };

  el0.parentElement = mockDocument.body;
  el1.parentElement = mockDocument.body;
  el2.parentElement = mockDocument.body;

  const mockWindow = {
    __visualdev_injected: false,
    scrollX: 0,
    scrollY: 0,
    location: { href: 'http://localhost:3000' },
    history: {},
    parent: {
      postMessage: (data) => parentMessages.push(data)
    },
    addEventListener: (type, fn) => {
      listeners['window_' + type] = fn;
    },
    getComputedStyle: () => ({ backgroundColor: 'transparent', color: 'black' })
  };

  const runScript = new Function('window', 'document', 'console', scriptContent);
  runScript(mockWindow, mockDocument, { log: () => {} });

  // 1. Click on el1 (2nd element in list, index 1)
  parentMessages.length = 0;
  const clickEvent1 = {
    target: el1,
    preventDefault: () => {},
    stopPropagation: () => {}
  };
  listeners['click'](clickEvent1);

  assert.strictEqual(parentMessages.length, 1);
  assert.strictEqual(parentMessages[0].type, 'VISUALDEV_SELECT_ELEMENT');
  assert.strictEqual(parentMessages[0].sourceLoc, 'src/List.jsx:15:3');
  assert.strictEqual(parentMessages[0].instanceIndex, 1);

  // 2. Receive VISUALDEV_UPDATE_CLASSNAME targeted at instanceIndex 1
  listeners['window_message']({
    data: {
      type: 'VISUALDEV_UPDATE_CLASSNAME',
      sourceLoc: 'src/List.jsx:15:3',
      instanceIndex: 1,
      className: 'updated-item-1'
    }
  });

  assert.strictEqual(el1.className, 'updated-item-1');
  assert.strictEqual(el0.className, 'item-class');
  assert.strictEqual(el2.className, 'item-class');

  // 3. Fallback check: VISUALDEV_UPDATE_CLASSNAME without instanceIndex updates matches[0]
  listeners['window_message']({
    data: {
      type: 'VISUALDEV_UPDATE_CLASSNAME',
      sourceLoc: 'src/List.jsx:15:3',
      className: 'updated-item-0'
    }
  });

  assert.strictEqual(el0.className, 'updated-item-0');

  // 4. Fallback check: VISUALDEV_UPDATE_CLASSNAME with out-of-bounds instanceIndex falls back to matches[0]
  listeners['window_message']({
    data: {
      type: 'VISUALDEV_UPDATE_CLASSNAME',
      sourceLoc: 'src/List.jsx:15:3',
      instanceIndex: 99,
      className: 'fallback-item-0'
    }
  });

  assert.strictEqual(el0.className, 'fallback-item-0');
});

test('App.jsx stores instanceIndex in state and passes instanceIndex in postMessage', () => {
  const appPath = path.join(__dirname, '../src/client/App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  assert.ok(appContent.includes('instanceIndex'));
  assert.ok(appContent.includes('instanceIndex: instanceIndex !== undefined ? instanceIndex : 0'));
  assert.ok(appContent.includes('instanceIndex: selectedElement.instanceIndex'));
});


