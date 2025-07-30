module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv'],
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-transform-class-static-block',
    'react-native-reanimated/plugin',
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['./src'],
        alias: {
          crypto: 'react-native-quick-crypto',
          'dok-wallet-blockchain-networks': './dok-wallet-blockchain-networks',
          'stream/web': 'web-streams-polyfill/dist/ponyfill.es6',
          'async_hooks': './src/async_hooks-polyfill.js',
          'worker_threads': './src/worker_threads-polyfill.js',
          'perf_hooks': './src/perf_hooks-polyfill.js',
          'util/types': './src/util-types-polyfill.js',
          'diagnostics_channel': './src/diagnostics_channel-polyfill.js',
          'node:stream': 'stream-browserify',
          'node:util': 'util',
          'node:events': 'events',
        },
      },
    ],
    ['react-native-paper/babel'],
  ],
  overrides: [
    {
      test: './node_modules/ethers',
      plugins: [
        '@babel/plugin-proposal-private-property-in-object',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-private-methods',
      ],
    },
  ],
};
