const babel = require('@babel/core');
const path = require('path');

module.exports = function (source, inputSourceMap) {
  const callback = this.async();
  const filename = this.resourcePath;

  if (filename.includes('node_modules')) {
    return callback(null, source, inputSourceMap);
  }

  let presetTypescript, presetReact;
  try {
    presetTypescript = require.resolve('@babel/preset-typescript');
  } catch (e) {
    presetTypescript = '@babel/preset-typescript';
  }
  try {
    presetReact = require.resolve('@babel/preset-react');
  } catch (e) {
    presetReact = '@babel/preset-react';
  }

  babel.transformAsync(source, {
    filename,
    inputSourceMap: inputSourceMap || undefined,
    sourceMaps: true,
    babelrc: false,
    configFile: false,
    presets: [
      [presetTypescript, { isTSX: true, allExtensions: true }],
      [presetReact, { runtime: 'automatic' }]
    ],
    plugins: [
      [require('./babel-plugin.js')]
    ]
  }).then(result => {
    callback(null, result.code, result.map);
  }).catch(err => {
    callback(err);
  });
};
