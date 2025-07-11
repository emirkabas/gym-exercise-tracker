const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [__dirname],
  resolver: {
    nodeModulesPaths: [__dirname + '/node_modules'],
  },
  watcher: {
    watchman: {
      enabled: true,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
