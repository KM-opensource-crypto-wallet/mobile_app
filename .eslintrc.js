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
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',
  },
  root: true,
  parser: '@babel/eslint-parser',
};
