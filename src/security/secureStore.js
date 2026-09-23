// Mobile `security/secureStore` adapter on react-native-sensitive-info 6.1.5
// (Nitro; iOS Keychain / Android Keystore). The shared vault imports this by
// alias; the web app supplies an IndexedDB file with the same exports. Contract:
//   capabilities.biometric              -> boolean
//   get(key, {accessControl?, authenticationPrompt?})    -> Promise<string | null>
//   set(key, value, {accessControl?, authenticationPrompt?}) -> Promise<void>
//   remove(key)                          -> Promise<void>   (missing key is not an error)
//   has(key)                             -> Promise<boolean> (no decrypt, no prompt)
// Failures surface as SecureStoreError with a platform-neutral `code`.
//
// Items live under their own keychain service so they can never collide with
// the legacy `persist:root2` blob or the App Attest keys under "myKeychain".
import {Platform} from 'react-native';
import {
  deleteItem,
  getItem,
  hasItem,
  setItem,
} from 'react-native-sensitive-info';
import {
  isAuthenticationCanceledError,
  isInvalidArgumentError,
  isKeyInvalidatedError,
  isNotFoundError,
} from 'react-native-sensitive-info/errors';
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
 * read/write on this: react-native-sensitive-info's resolver would otherwise
 * silently downgrade the item to a weaker policy (see `set`).
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

const CODE_MAP = {
  E_KEY_INVALIDATED: SECURE_STORE_ERROR_CODES.KEY_INVALIDATED,
  E_AUTH_CANCELED: SECURE_STORE_ERROR_CODES.USER_CANCELLED,
};

// Android 6.1.5 deletes a Keystore key the OS invalidated (enrollment change)
// and reports it as a plain IllegalStateException, without the
// [E_KEY_INVALIDATED] marker the JS layer maps. Without this, the biometric
// item would fail on every launch and never be re-enrolled (hasItem stays
// true). Messages: "Decryption key invalidated. Item must be recreated." /
// "Decryption key unavailable. Item must be recreated."
const ANDROID_INVALIDATED_MESSAGE = /key (invalidated|unavailable)/i;

const codeOf = error => {
  if (isKeyInvalidatedError(error)) {
    return SECURE_STORE_ERROR_CODES.KEY_INVALIDATED;
  }
  if (isAuthenticationCanceledError(error)) {
    return SECURE_STORE_ERROR_CODES.USER_CANCELLED;
  }
  if (CODE_MAP[error?.code]) {
    return CODE_MAP[error.code];
  }
  if (ANDROID_INVALIDATED_MESSAGE.test(error?.message || '')) {
    return SECURE_STORE_ERROR_CODES.KEY_INVALIDATED;
  }
  return SECURE_STORE_ERROR_CODES.UNKNOWN;
};

const translate = error =>
  new SecureStoreError(codeOf(error), error?.message, error);

const isClassified = error =>
  codeOf(error) !== SECURE_STORE_ERROR_CODES.UNKNOWN ||
  isInvalidArgumentError(error);

const serviceOnly = {service: SECURE_STORE_SERVICE};

const isProtected = options =>
  Boolean(options?.accessControl) && options.accessControl !== 'none';

// RNSI 6 shows `title` as the Keychain operation prompt on both platforms.
// On iOS its LAContext takes `description` as the reason and — oddly —
// `subtitle` as the fallback-button title, so our `{title, subtitle}` copy
// moves to `description` there. Android's BiometricPrompt has a real subtitle.
const toRnsiPrompt = prompt => {
  if (!prompt) {
    return undefined;
  }
  if (Platform.OS === 'ios') {
    const {subtitle, ...rest} = prompt;
    return subtitle && !rest.description
      ? {...rest, description: subtitle}
      : rest;
  }
  return prompt;
};

const withPrompt = (base, options) => {
  const authenticationPrompt = toRnsiPrompt(options?.authenticationPrompt);
  return authenticationPrompt ? {...base, authenticationPrompt} : base;
};

// The 6.x default policy is `secureEnclaveBiometry`: every write must say
// `none` explicitly or the item would silently become biometric-gated.
const buildSetOptions = options =>
  withPrompt(
    {
      service: SECURE_STORE_SERVICE,
      accessControl: options?.accessControl || 'none',
    },
    options,
  );

// Reads take the same `authenticationPrompt` key; the stored policy governs.
const buildGetOptions = options => withPrompt(serviceOnly, options);

// "Missing" vs "failed" for a read. RNSI 6 returns null for an absent key on
// both platforms, so an error means the read itself failed. Only for
// unprotected items and only for unclassified errors: confirm absence with
// hasItem before answering null — a caller that treats a transient failure as
// "nothing stored" would move on without the data. A protected read's failure,
// or a known code, must never be mistaken for "absent".
const classifyReadError = async (error, key, rnsiOptions, protectedRead) => {
  if (isNotFoundError(error)) {
    return null;
  }
  if (!protectedRead && !isClassified(error)) {
    try {
      if (!(await hasItem(key, {service: rnsiOptions.service}))) {
        return null;
      }
    } catch {
      // fall through to the translated error
    }
  }
  throw translate(error);
};

const valueOf = item => (item?.value == null ? null : item.value);

export const get = async (key, options) => {
  const rnsiOptions = buildGetOptions(options);
  try {
    return valueOf(await getItem(key, rnsiOptions));
  } catch (error) {
    return classifyReadError(error, key, rnsiOptions, isProtected(options));
  }
};

/**
 * Unprotected read from another keychain service (the pre-vault
 * `persist:root2` blob under REDUX_KEYCHAIN_NAME). Same missing-vs-failed
 * rules as get(): null only when the item is really absent, otherwise a
 * SecureStoreError so the caller can fail instead of assuming "nothing there".
 */
export const getFromService = async (key, service) => {
  const rnsiOptions = {service};
  try {
    return valueOf(await getItem(key, rnsiOptions));
  } catch (error) {
    return classifyReadError(error, key, rnsiOptions, false);
  }
};

/**
 * RNSI 6 never fails a write over an unavailable policy: its resolver walks
 * `[requested, secureEnclaveBiometry, biometryCurrentSet, biometryAny,
 * devicePasscode, none]` and applies the first the device supports. A DEK
 * copy meant for biometrics must never sit behind a weaker gate, so a
 * downgraded protected write is deleted again and reported as `unavailable`.
 */
export const set = async (key, value, options) => {
  const rnsiOptions = buildSetOptions(options);
  let result;
  try {
    result = await setItem(key, value, rnsiOptions);
  } catch (error) {
    throw translate(error);
  }
  if (!isProtected(options)) {
    return;
  }
  const applied = result?.metadata?.accessControl;
  if (applied && applied !== rnsiOptions.accessControl) {
    try {
      await deleteItem(key, serviceOnly);
    } catch {
      // best effort; the error below is what the caller acts on
    }
    throw new SecureStoreError(
      SECURE_STORE_ERROR_CODES.UNAVAILABLE,
      `Requested access control "${rnsiOptions.accessControl}" is not available on this device (platform offered "${applied}")`,
    );
  }
};

export const remove = async key => {
  try {
    // Resolves false for a missing key; never throws for one.
    await deleteItem(key, serviceOnly);
  } catch (error) {
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
