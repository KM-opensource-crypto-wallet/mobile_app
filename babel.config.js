module.exports = {
  presets: ['babel-preset-expo'],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
  plugins: [
    ['module:react-native-dotenv'],
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-transform-class-static-block',
    ['@babel/plugin-transform-export-namespace-from', {corejs: 3}],
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
