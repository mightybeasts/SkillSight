const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Block root react-dom@19 so mobile uses its own react-dom@18
config.resolver.blockList = [
  new RegExp(
    path
      .resolve(monorepoRoot, 'node_modules', 'react-dom')
      .replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*'
  ),
]

module.exports = config
