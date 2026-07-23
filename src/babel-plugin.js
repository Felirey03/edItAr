const path = require('path');

module.exports = function (babel) {
  const t = babel.types;
  return {
    visitor: {
      JSXOpeningElement(jsxPath, state) {
        const location = jsxPath.node.loc;
        if (!location) return;

        const filename = state.file.opts.filename;
        if (!filename) return;

        // Skip node_modules and files outside the source folder
        if (filename.includes('node_modules')) return;

        const cwd = state.cwd || process.cwd();
        // Make the filename relative to the project root
        let relativePath = path.relative(cwd, filename);

        // Standardize path format to forward slashes (Unix-style)
        relativePath = relativePath.replace(/\\/g, '/');

        const line = location.start.line;
        const column = location.start.column + 1; // 1-indexed for column position in attributes

        const sourceLoc = `${relativePath}:${line}:${column}`;

        // Verify if data-source-loc is already present to prevent duplicate injections
        const hasAttr = jsxPath.node.attributes.some(
          attr => t.isJSXAttribute(attr) && attr.name.name === 'data-source-loc'
        );

        if (!hasAttr) {
          jsxPath.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('data-source-loc'),
              t.stringLiteral(sourceLoc)
            )
          );
        }
      }
    }
  };
};
