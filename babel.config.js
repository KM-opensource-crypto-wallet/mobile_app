module.exports = {
  presets: ['module:@react-native/babel-preset'],
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
