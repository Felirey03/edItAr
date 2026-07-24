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
  assert.ok(helpOut.includes('Usage: npx editar'));
  assert.ok(helpOut.includes('init'));

  const versionOut = execSync(`node ${binPath} --version`).toString();
  assert.ok(versionOut.includes('edItAr v1.0.0'));
});

test('bin/editar.js init command integration in temporary workspace', () => {
  const tmp = createTempDir();
  const binPath = path.join(__dirname, '../bin/editar.js');
  try {
    fs.mkdirSync(path.join(tmp, 'app'), { recursive: true });
    const layoutFile = path.join(tmp, 'app', 'layout.tsx');
    fs.writeFileSync(layoutFile, 'export default function RootLayout({ children }: { children: React.ReactNode }) { return (<html><head></head><body>{children}</body></html>); }');

    const output = execSync(`node ${binPath} init`, { cwd: tmp }).toString();
    assert.ok(output.includes('Detected Next.js App Router'));
    assert.ok(output.includes('Created babel.config.js'));
    assert.ok(output.includes('Injected client script tag'));

    assert.ok(fs.existsSync(path.join(tmp, 'babel.config.js')));
    const layoutContent = fs.readFileSync(layoutFile, 'utf8');
    assert.ok(layoutContent.includes('editar-client.js'));
  } finally {
    removeTempDir(tmp);
  }
});
