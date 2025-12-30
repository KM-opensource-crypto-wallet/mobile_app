const path = require('path');
const {getDefaultConfig} = require('expo/metro-config');
const {mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const {assetExts, sourceExts} = defaultConfig.resolver;
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    // extraNodeModules: require('node-libs-react-native'),
    extraNodeModules: {
      // Spread all node-libs-react-native modules
      ...require('node-libs-react-native'),

      // Add/override with custom shims
      tls: path.resolve(__dirname, 'src/shims/tls.js'),
      http2: path.resolve(__dirname, 'src/shims/http2.js'),
      net: path.resolve(__dirname, 'src/shims/net.js'),
      dns: path.resolve(__dirname, 'src/shims/dns.js'),
      // Better crypto
      crypto: require.resolve('react-native-quick-crypto'),
    },
    exports: 'non-strict',
    unstable_conditionNames: ['browser', 'require', 'react-native'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
