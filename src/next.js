const path = require('path');

function withEditar(nextConfig = {}) {
  return {
    ...nextConfig,
    webpack(config, options) {
      const { dev } = options;

      if (dev) {
        config.module.rules.push({
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: path.resolve(__dirname, 'webpack-loader.js'),
            }
          ]
        });
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }
      return config;
    }
  };
}

module.exports = withEditar;
