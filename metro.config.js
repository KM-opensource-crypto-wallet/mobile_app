const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    transformer: {
        babelTransformerPath: require.resolve(
            "react-native-svg-transformer/react-native",
        ),
    },
    resolver: {
        assetExts: assetExts.filter((ext) => ext !== "svg"),
        sourceExts: [...sourceExts, "svg"],
        extraNodeModules: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('readable-stream'),
            buffer: require.resolve('buffer'),
            process: require.resolve('process/browser'),
            events: require.resolve('events'),
            https: require.resolve('https-browserify'),
            http: require.resolve('http-browserify'),
            url: require.resolve('url'),
            assert: require.resolve('assert'),
        },
    },
};

module.exports = mergeConfig(defaultConfig, config);
