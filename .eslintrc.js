module.exports = {
  env: {
    es2020: true,
  },
  plugins: [
    // ...
    'redux-saga',
    'react-redux',
  ],
  extends: [
    '@react-native',
    'plugin:redux-saga/recommended',
    'plugin:react-redux/recommended',
  ],
  root: true,
  parser: '@babel/eslint-parser',
};
