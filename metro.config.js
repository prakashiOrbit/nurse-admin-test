const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Remove `.svg` from assetExts and add it to sourceExts
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg');
defaultConfig.resolver.sourceExts.push('svg');

// Add transformer for SVGs
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer')
};

module.exports = mergeConfig(defaultConfig, {
  server:{
    port: 8088
  }
});
