module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
  plugins: [
    ['module:react-native-dotenv'],
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-transform-class-static-block',
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['./src'],
        alias: {
          crypto: 'react-native-quick-crypto',
          'dok-wallet-blockchain-networks': './dok-wallet-blockchain-networks',
          assets: './src/assets',
          components: './src/components',
          data: './src/data',
          redux: './src/redux',
          utils: './src/utils',
          myWallet: './src/myWallet',
          theme: './src/theme',
        },
      },
    ],
    ['react-native-paper/babel'],
    'react-native-worklets/plugin',
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
