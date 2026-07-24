const fs = require('fs');
const path = require('path');

function injectClientScript(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return {
      action: 'failed',
      targetPath: targetPath || 'null',
      error: 'Target layout file does not exist'
    };
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (content.includes('editar-client.js')) {
    return {
      action: 'already-injected',
      targetPath
    };
  }

  const ext = path.extname(targetPath).toLowerCase();
  const isJsx = ['.jsx', '.tsx', '.js', '.ts'].includes(ext);

  const scriptTag = isJsx
    ? '<script src="http://localhost:8080/editar-client.js" async />'
    : '<script src="http://localhost:8080/editar-client.js" async></script>';

  let updatedContent = null;

  if (content.includes('</head>')) {
    updatedContent = content.replace('</head>', `  ${scriptTag}\n</head>`);
  } else if (content.includes('</Head>')) {
    updatedContent = content.replace('</Head>', `  ${scriptTag}\n</Head>`);
  } else if (content.includes('</body>')) {
    updatedContent = content.replace('</body>', `  ${scriptTag}\n</body>`);
  } else if (content.includes('</html>')) {
    updatedContent = content.replace('</html>', `  ${scriptTag}\n</html>`);
  } else if (isJsx && (content.includes('return (') || content.includes('return('))) {
    // For React layout components returning JSX without explicit head tag, inject right inside body or outer element
    if (content.includes('<body')) {
      updatedContent = content.replace(/<body([^>]*)>/, `<body$1>\n        ${scriptTag}`);
    } else if (content.includes('<html')) {
      updatedContent = content.replace(/<html([^>]*)>/, `<html$1>\n        ${scriptTag}`);
    }
  }

  if (!updatedContent) {
    return {
      action: 'failed',
      targetPath,
      error: 'Could not locate suitable HTML/JSX anchor tag (</head>, </body>, or </html>)'
    };
  }

  fs.writeFileSync(targetPath, updatedContent, 'utf8');

  return {
    action: 'injected',
    targetPath
  };
}

module.exports = {
  injectClientScript
};
