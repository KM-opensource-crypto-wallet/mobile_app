module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
  plugins: [
    ['module:react-native-dotenv'],
    ['react-native-reanimated/plugin'],
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-transform-class-static-block',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          crypto: 'react-native-quick-crypto',
          'dok-wallet-blockchain-networks': './dok-wallet-blockchain-networks',
        },
      },
    ],
    ['react-native-paper/babel'],
    'react-native-worklets/plugin',
  ],
};
