// Mobile `security/secureStore` adapter on react-native-sensitive-info 5.6.2
// (iOS Keychain / Android Keystore). The shared vault imports this by alias;
// the web app supplies an IndexedDB file with the same exports. Contract:
//   capabilities.biometric              -> boolean
//   get(key, {accessControl?, authenticationPrompt?})    -> Promise<string | null>
//   set(key, value, {accessControl?, authenticationPrompt?}) -> Promise<void>
//   remove(key)                          -> Promise<void>   (missing key is not an error)
//   has(key)                             -> Promise<boolean> (no decrypt, no prompt)
// Failures surface as SecureStoreError with a platform-neutral `code`.
//
// Items live under their own keychain service so they can never collide with
// the legacy `persist:root2` blob or the App Attest keys under "myKeychain".
import {
  deleteItem,
  getItem,
  hasItem,
  setItem,
} from 'react-native-sensitive-info';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import {
  SECURE_STORE_ERROR_CODES,
  SecureStoreError,
} from 'dok-wallet-blockchain-networks/security/errors';

export const SECURE_STORE_SERVICE =
  process.env.SECURE_STORE_KEYCHAIN_NAME || 'dok.vault';

// "This platform can store biometric-bound items." Whether a sensor is
// enrolled right now is a separate, runtime question: isBiometricAvailable().
export const capabilities = Object.freeze({biometric: true});

/**
 * True only when a biometric sensor is present AND enrolled. Rejections from
 * react-native-fingerprint-scanner (not enrolled, not available, locked out,
 * simulator without Face ID) all mean "no". The vault gates every biometric
 * read/write on this, because react-native-sensitive-info would otherwise
 * fall back to the device passcode on iOS when biometrics cannot be evaluated.
 */
export const isBiometricAvailable = async () => {
  try {
    const type = await FingerprintScanner.isSensorAvailable();
    return Boolean(type);
  } catch {
    return false;
  } finally {
    try {
      FingerprintScanner.release();
    } catch {
      // nothing to release
    }
  }
};

const RNSI_NOT_FOUND = 'E_NOT_FOUND';

const CODE_MAP = {
  E_KEY_INVALIDATED: SECURE_STORE_ERROR_CODES.KEY_INVALIDATED,
  E_AUTH_CANCELED: SECURE_STORE_ERROR_CODES.USER_CANCELLED,
  E_KEYSTORE_UNAVAILABLE: SECURE_STORE_ERROR_CODES.UNAVAILABLE,
};

const translate = error =>
  new SecureStoreError(
    CODE_MAP[error?.code] || SECURE_STORE_ERROR_CODES.UNKNOWN,
    error?.message,
    error,
  );

const serviceOnly = {keychainService: SECURE_STORE_SERVICE};

const isProtected = options =>
  Boolean(options?.accessControl) && options.accessControl !== 'none';

// RNSI's write and read options differ: StorageOptions carries the policy and
// `authenticationPrompt`; RetrievalOptions carries only `prompt` (the stored
// policy governs the read). Sending the wrong key silently drops the copy.
const buildSetOptions = options => ({
  keychainService: SECURE_STORE_SERVICE,
  accessControl: options?.accessControl || 'none',
  ...(options?.authenticationPrompt
    ? {authenticationPrompt: options.authenticationPrompt}
    : {}),
});

const buildGetOptions = options => ({
  keychainService: SECURE_STORE_SERVICE,
  ...(options?.authenticationPrompt
    ? {prompt: options.authenticationPrompt}
    : {}),
});

export const get = async (key, options) => {
  try {
    return await getItem(key, buildGetOptions(options));
  } catch (error) {
    if (error?.code === RNSI_NOT_FOUND) {
      return null;
    }
    // Some Android builds throw a generic error for a missing key instead of
    // E_NOT_FOUND (see utils/apiIntegrity.js). Only for unprotected items and
    // only for unclassified errors: a protected read's failure, or a known
    // code such as E_KEYSTORE_UNAVAILABLE, must never be mistaken for "absent".
    if (!isProtected(options) && !CODE_MAP[error?.code]) {
      try {
        if (!(await hasItem(key, serviceOnly))) {
          return null;
        }
      } catch {
        // fall through to the translated error
      }
    }
    throw translate(error);
  }
};

export const set = async (key, value, options) => {
  try {
    await setItem(key, value, buildSetOptions(options));
  } catch (error) {
    throw translate(error);
  }
};

export const remove = async key => {
  try {
    await deleteItem(key, serviceOnly);
  } catch (error) {
    if (error?.code === RNSI_NOT_FOUND) {
      return;
    }
    throw translate(error);
  }
};

export const has = async key => {
  try {
    return await hasItem(key, serviceOnly);
  } catch (error) {
    throw translate(error);
  }
};
