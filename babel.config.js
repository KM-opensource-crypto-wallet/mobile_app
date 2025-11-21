module.exports = {
  presets: [
    [
      "module:@react-native/babel-preset",
      { unstable_transformProfile: "hermes-stable" },
    ],
  ],
  env: {
    production: {
      plugins: ["react-native-paper/babel"],
    },
  },
  plugins: [
    ["module:react-native-dotenv"],
    [
      "react-native-reanimated/plugin",

    ],
    [
      "@babel/plugin-transform-export-namespace-from", { corejs: 3 }
    ],
    [
      "module-resolver",
      {
        root: ['./src'],
        alias: {
          crypto: 'react-native-quick-crypto',
          'dok-wallet-blockchain-networks': './dok-wallet-blockchain-networks',
        },
      },
    ],
  ],
};
