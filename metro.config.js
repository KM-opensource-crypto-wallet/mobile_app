const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const {assetExts, sourceExts} = getDefaultConfig(__dirname).resolver;
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve(
      'react-native-svg-transformer/react-native',
    ),
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
    resolveRequest: (context, moduleName, platform) => {
      // Force libsodium packages to use CommonJS versions instead of ESM
      if (
        moduleName === 'libsodium-wrappers-sumo' ||
        moduleName.startsWith('libsodium-wrappers-sumo/')
      ) {
        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js',
          ),
          type: 'sourceFile',
        };
      }
      // Default resolver
      return context.resolveRequest(context, moduleName, platform);
    },
    unstable_conditionNames: ['browser', 'require', 'react-native'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
