module.exports = {
  preset: '@react-native/jest-preset',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|@breeztech|@rneui|uuid|nanoid|immer|redux|@reduxjs|@redux-saga|reselect)',
  ],
  moduleNameMapper: {
    // uuid v13 ships an ESM "exports" map; pin Jest to the CJS node build.
    '^uuid$': require.resolve('uuid'),
  },
};
