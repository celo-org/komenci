const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = function(config) {
  const oldTsConfig = config.resolve.plugins[0]
  const newTsConfig = new TsconfigPathsPlugin({
    extensions: ['.ts', '.txs', '.js'],
    baseUrl: '.',
  })

  config.resolve.plugins = [ newTsConfig ]
  config.module.rules.push({ test: /\.node$/, loader: 'node-loader' })
  return config
}
