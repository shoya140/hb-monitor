/* eslint-disable @typescript-eslint/no-var-requires */
const baseConfig = require('./webpack.common.js')

module.exports = [
  {
    ...baseConfig,
    target: 'web', // target: 'electron-renderer' does not support live reload.
    entry: {
      renderer: './src/renderer/index.tsx',
    },
    devServer: {
      historyApiFallback: true,
    },
    resolve: {
      ...baseConfig.resolve,
      fallback: {
        fs: false,
      },
    },
    devtool: 'source-map',
  },
]
