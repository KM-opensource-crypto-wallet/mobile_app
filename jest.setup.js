/* eslint-env jest */
/**
 * Mocks for the app's own native modules.
 *
 * `@react-native/jest-preset` already mocks core react-native; its setup file
 * runs before this one (Jest concatenates preset `setupFiles` ahead of ours).
 * What is left are the third-party native modules that throw at *import* time
 * under Node, which would otherwise make any suite that transitively reaches
 * app code fail to load.
 */

// The app treats this as a drop-in for node's crypto (createHash, randomBytes,
// randomInt, pbkdf2, timingSafeEqual), so hand it the real thing rather than
// stubs — the hashing/derivation paths then behave correctly under test.
// NB: the `node:` prefix is required. babel.config.js aliases bare `crypto`
// to react-native-quick-crypto, so `require('crypto')` here would resolve
// back into this very mock and recurse.
jest.mock('react-native-quick-crypto', () => {
  const nodeCrypto = require('node:crypto');
  return {__esModule: true, default: nodeCrypto, ...nodeCrypto};
});

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);
