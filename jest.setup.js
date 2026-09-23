/* eslint-env jest */
// The storage layer reads these at import time (legacy blob key / service).
// react-native-dotenv inlines `process.env.NAME` from .env during the Babel
// transform (also under Jest), so go through a plain reference here to set
// fallbacks for a checkout without a .env file.
const env = process.env;
env.REDUX_KEY = env.REDUX_KEY || 'root2';
env.REDUX_KEYCHAIN_NAME = env.REDUX_KEYCHAIN_NAME || 'myKeychain';
env.SECURE_STORE_KEYCHAIN_NAME = env.SECURE_STORE_KEYCHAIN_NAME || 'dok.vault';
env.REDUX_SHARED_PREFERENCE_NAME =
  env.REDUX_SHARED_PREFERENCE_NAME || 'mySharedPrefs';
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

// react-native-sensitive-info 6.1.5 (Nitro) has no Jest mock of its own. This
// in-memory one keeps the 6.x semantics src/security/secureStore.js relies on:
// items are namespaced by `service`; getItem returns `{key, service, value,
// metadata}` or null (both platforms); setItem returns `{metadata}` with the
// policy actually applied (`__mock.state.downgradeTo` models the native
// resolver falling back to a weaker policy); deleteItem returns whether an
// item was removed; biometric-protected items count an OS prompt on every
// protected read/write; `__mock.invalidate(key)` simulates the Keystore
// destroying a key after an enrollment change (E_KEY_INVALIDATED). Errors
// carry `code` like the typed SensitiveInfoError subclasses do.
jest.mock('react-native-sensitive-info', () => {
  const items = new Map();
  const state = {
    prompts: 0,
    invalidated: new Set(),
    cancelNext: false,
    downgradeTo: null,
  };
  const err = (code, message) =>
    Object.assign(new Error(message || code), {code});
  const id = (key, options) => `${options?.service || 'default'}::${key}`;
  const isProtected = accessControl =>
    Boolean(accessControl) && accessControl !== 'none';
  const metadataFor = accessControl => ({
    securityLevel: isProtected(accessControl) ? 'biometry' : 'software',
    backend: 'keychain',
    accessControl,
    timestamp: Math.floor(Date.now() / 1000),
    keyVersion: 1,
  });
  const api = {
    __esModule: true,
    __mock: {
      items,
      state,
      reset() {
        items.clear();
        state.prompts = 0;
        state.invalidated.clear();
        state.cancelNext = false;
        state.downgradeTo = null;
        for (const fn of [
          api.setItem,
          api.getItem,
          api.hasItem,
          api.deleteItem,
        ]) {
          fn.mockClear();
        }
      },
      invalidate(key, options) {
        state.invalidated.add(id(key, options));
      },
    },
    setItem: jest.fn(async (key, value, options) => {
      const requested = options?.accessControl || 'secureEnclaveBiometry';
      const applied =
        isProtected(requested) && state.downgradeTo
          ? state.downgradeTo
          : requested;
      if (isProtected(applied)) {
        state.prompts += 1;
      }
      items.set(id(key, options), {value, accessControl: applied});
      return {metadata: metadataFor(applied)};
    }),
    getItem: jest.fn(async (key, options) => {
      const item = items.get(id(key, options));
      if (!item) {
        return null;
      }
      if (isProtected(item.accessControl)) {
        state.prompts += 1;
        if (state.invalidated.has(id(key, options))) {
          throw err(
            'E_KEY_INVALIDATED',
            '[E_KEY_INVALIDATED] Biometric enrollment changed.',
          );
        }
        if (state.cancelNext) {
          state.cancelNext = false;
          throw err(
            'E_AUTH_CANCELED',
            '[E_AUTH_CANCELED] Authentication prompt canceled by the user.',
          );
        }
      }
      return {
        key,
        service: options?.service || 'default',
        value: item.value,
        metadata: metadataFor(item.accessControl),
      };
    }),
    hasItem: jest.fn(async (key, options) => items.has(id(key, options))),
    deleteItem: jest.fn(async (key, options) => items.delete(id(key, options))),
  };
  return api;
});

// The typed-error predicates of react-native-sensitive-info/errors, keyed on
// the `code` the mock above (and the real native layer) attaches.
jest.mock('react-native-sensitive-info/errors', () => {
  const byCode = code => error => error?.code === code;
  return {
    __esModule: true,
    isNotFoundError: byCode('E_NOT_FOUND'),
    isAuthenticationCanceledError: byCode('E_AUTH_CANCELED'),
    isIntegrityViolationError: byCode('E_INTEGRITY_VIOLATION'),
    isKeyInvalidatedError: byCode('E_KEY_INVALIDATED'),
    isRotationFailedError: byCode('E_ROTATION_FAILED'),
    isInvalidArgumentError: byCode('E_INVALID_ARGUMENT'),
  };
});

// react-native-fingerprint-scanner: only isSensorAvailable() is consulted by
// the secure-store adapter. `__mock.available = false` models a device or
// simulator with no enrolled biometrics (the library rejects).
jest.mock('react-native-fingerprint-scanner', () => {
  const state = {available: true, type: 'Face ID'};
  return {
    __esModule: true,
    __mock: {
      state,
      reset() {
        state.available = true;
        state.type = 'Face ID';
      },
    },
    default: {
      isSensorAvailable: jest.fn(async () => {
        if (!state.available) {
          throw Object.assign(new Error('Biometrics not enrolled'), {
            name: 'FingerprintScannerNotEnrolled',
          });
        }
        return state.type;
      }),
      authenticate: jest.fn(async () => true),
      release: jest.fn(),
    },
  };
});

// react-native-mmkv ships an in-memory mock of its own, but ours also enforces
// the native 32-byte limit on `encryptionKey` (a hex-encoded 32-byte key is 64
// chars and would throw on device) and exposes the instance registry so tests
// can assert on `existsMMKV`/`deleteMMKV`.
jest.mock('react-native-mmkv', () => {
  const instances = new Map();
  const create = ({id = 'mmkv.default', encryptionKey} = {}) => {
    if (encryptionKey != null && encryptionKey.length > 32) {
      throw new Error(
        `MMKV encryptionKey must be at most 32 bytes (got ${encryptionKey.length})`,
      );
    }
    if (instances.has(id)) {
      return instances.get(id);
    }
    const data = new Map();
    const instance = {
      __id: id,
      __encryptionKey: encryptionKey,
      getString: key =>
        typeof data.get(key) === 'string' ? data.get(key) : undefined,
      getNumber: key =>
        typeof data.get(key) === 'number' ? data.get(key) : undefined,
      getBoolean: key =>
        typeof data.get(key) === 'boolean' ? data.get(key) : undefined,
      set: (key, value) => {
        data.set(key, value);
      },
      remove: key => data.delete(key),
      contains: key => data.has(key),
      getAllKeys: () => [...data.keys()],
      clearAll: () => data.clear(),
    };
    instances.set(id, instance);
    return instance;
  };
  return {
    __esModule: true,
    __mock: {
      instances,
      reset() {
        instances.clear();
      },
    },
    createMMKV: jest.fn(create),
    existsMMKV: jest.fn(id => instances.has(id)),
    deleteMMKV: jest.fn(id => instances.delete(id)),
  };
});

// `services/logger` is imported by redux slices and utilities under test; the
// native Sentry module is not available in Node, so stub the SDK surface.
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: component => component,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setAttributes: jest.fn(),
  setExtras: jest.fn(),
  withScope: callback =>
    callback({setLevel() {}, setTags() {}, setExtras() {}}),
  consoleSandbox: callback => callback(),
  breadcrumbsIntegration: jest.fn(() => ({name: 'Breadcrumbs'})),
  logger: {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));
