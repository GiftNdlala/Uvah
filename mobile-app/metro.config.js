const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const defaultConfig = getDefaultConfig(__dirname);
const existingBlockList = Array.isArray(defaultConfig.resolver.blockList)
  ? defaultConfig.resolver.blockList
  : defaultConfig.resolver.blockList
    ? [defaultConfig.resolver.blockList]
    : [];

const config = {
  resolver: {
    blockList: [
      ...existingBlockList,
      /[\\\/]android[\\\/]build[\\\/].*/,
      /[\\\/]android[\\\/]app[\\\/]build[\\\/].*/,
      /[\\\/]\.gradle[\\\/].*/,
      /[\\\/]tmp[\\\/].*/,
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
