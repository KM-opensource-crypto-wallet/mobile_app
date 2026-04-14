import {Platform} from 'react-native';
import {deleteItem, getItem, setItem} from 'react-native-sensitive-info';
import crypto from 'react-native-quick-crypto';
import {
  generateHardwareKey,
  generateHardwareSignatureWithAssertion,
  getAttestation,
  isAttestationServiceAvailable,
  isPlayServicesAvailable,
  prepareIntegrityToken,
  requestIntegrityToken,
} from '@pagopa/io-react-native-integrity';
import {wlName} from 'utils/wlData';
import {config} from 'dok-wallet-blockchain-networks/config/config';

// ─── Header names ─────────────────────────────────────────────────────────────
//
// x-app-name replaces x-integrity-platform + x-integrity-app-id.
// Format: '<wlName>-<platform>' e.g. 'dokwallet-ios', 'kimlwallet-android'
//
// Headers NO LONGER sent per-request (removed from new design):
//   x-integrity-attestation — stored server-side after one-time registration
//   x-integrity-nonce       — server issues challenges, client does not generate them

export const INTEGRITY_HEADERS = {
  appName: 'x-app-name',
  proof: 'x-integrity-proof',
  keyId: 'x-integrity-key-id',
};

// ─── Secure storage keys ──────────────────────────────────────────────────────
//
// Only the hardware keyId and a registration flag are stored.
// Attestation blob and nonce are no longer stored on device.

const INTEGRITY_STORAGE_KEYS = {
  iosKeyId: 'integrity_ios_key_id',
  iosRegistered: 'integrity_ios_registered', // stored as the string 'true'
};

// ─── Config ───────────────────────────────────────────────────────────────────

const ATTEST_WORKER_URL = config.ATTEST_WORKER_BASE_URL.replace(/\/$/, '');
const ANDROID_PROJECT_NUMBER =
  process.env.DOK_ANDROID_PLAY_INTEGRITY_PROJECT_NUMBER ?? '';

// ─── Module-level state ───────────────────────────────────────────────────────

let requestInterceptorId = null;
let responseInterceptorId = null;
let androidPreparePromise = null;
// Serializes concurrent iOS registration attempts (prevents duplicate registrations)
let iosRegistrationPromise = null;
// Serializes iOS assertion generation so sign counts increment sequentially.
// Concurrent requests generating assertions in parallel produce out-of-order
// sign counts that the CF Worker rejects. Chaining ensures N+1 only starts
// after N completes.
let iosAssertionChain = Promise.resolve();
// Held for the duration of initializeDokApiIntegrity() so that any DokApi
// request — even one that bypasses the integrityReady component gate — waits
// for the full initialization (iOS registration / Android prepare) before
// the request interceptor tries to attach integrity headers.
let integrityInitPromise = null;
// Once true, no further challenge/register calls are made this session.
// Prevents retry loops when the backend rejects registration.
let registrationPermanentlyFailed = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const storageOptions = {
  accessControl: 'none',
  keychainService: process.env.REDUX_KEYCHAIN_NAME,
};

const getStorageValue = key => getItem(key, storageOptions);
const setStorageValue = (key, value) => setItem(key, value, storageOptions);
const removeStorageValue = key => deleteItem(key, storageOptions);

// Returns e.g. 'dokwallet-ios', 'kimlwallet-android'
const getAppName = () => `${wlName}-${Platform.OS}`;

// SHA256(METHOD\nPATH\nRAW_BODY) — must match CF Worker's createRequestHash.
// PATH = requestConfig.url = Axios relative path (e.g. '/list-crypto')
// which equals url.pathname on the CF Worker side.
const createRequestHash = requestConfig => {
  const method = requestConfig?.method?.toUpperCase?.() || 'GET';
  const path = requestConfig?.url || '';
  const body = requestConfig?.data
    ? typeof requestConfig.data === 'string'
      ? requestConfig.data
      : JSON.stringify(requestConfig.data)
    : '';
  return crypto
    .createHash('sha256')
    .update(`${method}\n${path}\n${body}`)
    .digest('hex');
};

// ─── iOS: hardware key lifecycle ──────────────────────────────────────────────

const getOrCreateKeyId = async () => {
  const existing = await getStorageValue(INTEGRITY_STORAGE_KEYS.iosKeyId);
  if (existing) {
    return existing;
  }
  const newKey = await generateHardwareKey();
  await setStorageValue(INTEGRITY_STORAGE_KEYS.iosKeyId, newKey);
  return newKey;
};

const clearIOSRegistration = async () => {
  await removeStorageValue(INTEGRITY_STORAGE_KEYS.iosKeyId);
  await removeStorageValue(INTEGRITY_STORAGE_KEYS.iosRegistered);
};

// ─── iOS: CF Worker registration ─────────────────────────────────────────────
//
// Full registration flow (called once per device, or after key rotation):
//   1. Fetch a server-issued challenge from CF Worker
//   2. Generate hardware key (or reuse existing)
//   3. Call Apple getAttestation(challenge, keyId) — challenge is the base64 string
//   4. POST attestation to CF Worker for verification and public key storage
//   5. Mark device as registered in SecureStorage

const registerIOSDevice = async () => {
  const appName = getAppName();

  if (!ATTEST_WORKER_URL) {
    throw new Error('ATTEST_WORKER_URL is not configured');
  }

  // 1. Request a server-side challenge
  const challengeResp = await fetch(`${ATTEST_WORKER_URL}/attest/challenge`, {
    method: 'GET',
    headers: {'x-app-name': appName},
  });

  if (!challengeResp.ok) {
    throw new Error(`Challenge request failed: ${challengeResp.status}`);
  }

  const {challengeId, challenge} = await challengeResp.json();

  // 2. Get or generate the hardware key
  const keyId = await getOrCreateKeyId();

  // 3. Apple attestation — challenge is passed as the base64 string from the server.
  // @pagopa/io-react-native-integrity's getAttestation(nonce, keyId) accepts a string.
  // The CF Worker verifies with Buffer.from(challenge, 'base64') — encoding is consistent.
  const attestation = await getAttestation(challenge, keyId);

  // 4. Register with CF Worker
  const registerResp = await fetch(`${ATTEST_WORKER_URL}/attest/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-name': appName,
    },
    body: JSON.stringify({keyId, attestation, challengeId}),
  });

  if (!registerResp.ok) {
    let detail = '';
    try {
      const err = await registerResp.json();
      detail = err?.error ?? '';
    } catch {
      // ignore parse error
    }
    throw new Error(`Registration failed (${registerResp.status}): ${detail}`);
  }

  // 5. Persist the registration flag
  await setStorageValue(INTEGRITY_STORAGE_KEYS.iosRegistered, 'true');

  return keyId;
};

// Ensures iOS registration is done exactly once.
// Concurrent calls share a single in-flight promise.
const ensureIOSRegistered = async () => {
  // Permanent failure: registration was attempted and failed this session.
  // Don't retry — prevents hammering the challenge/register endpoints.
  if (registrationPermanentlyFailed) {
    console.warn(
      '[integrity] ensureIOSRegistered: permanently failed this session, skipping',
    );
    throw new Error('iOS registration permanently failed this session');
  }

  // Fast path: if re-registration is already in progress (set synchronously by
  // the response interceptor on 409), join it immediately without reading
  // storage — which could return a stale old keyId before clearIOSRegistration
  // has finished wiping it.
  if (iosRegistrationPromise) {
    return iosRegistrationPromise;
  }

  const [storedKeyId, isRegistered] = await Promise.all([
    getStorageValue(INTEGRITY_STORAGE_KEYS.iosKeyId),
    getStorageValue(INTEGRITY_STORAGE_KEYS.iosRegistered),
  ]);

  // Check again after the async storage read — it may have been set while waiting.
  if (iosRegistrationPromise) {
    return iosRegistrationPromise;
  }

  if (storedKeyId && isRegistered === 'true') {
    return storedKeyId;
  }

  iosRegistrationPromise = registerIOSDevice()
    .catch(err => {
      // Mark permanently failed so future calls skip registration entirely.
      // .catch before .finally ensures the rejection re-propagates to callers.
      registrationPermanentlyFailed = true;
      console.error(
        '[integrity] ensureIOSRegistered: registration failed, marked permanent:',
        err?.message,
      );
      throw err;
    })
    .finally(() => {
      iosRegistrationPromise = null;
    });

  return iosRegistrationPromise;
};

// Wraps generateHardwareSignatureWithAssertion in a serial promise chain so
// that concurrent requests produce sign counts in a predictable ascending order.
// Failures are absorbed so a single bad assertion does not stall the queue.
const generateSerializedAssertion = (requestHash, keyId) => {
  const next = iosAssertionChain.then(() =>
    generateHardwareSignatureWithAssertion(requestHash, keyId),
  );
  // Swallow rejections on the chain tail — callers get the real error via `next`
  iosAssertionChain = next.then(
    () => {},
    () => {},
  );
  return next;
};

// ─── iOS: per-request integrity headers ──────────────────────────────────────

const createIOSIntegrityHeaders = async requestConfig => {
  let isAvailable = false;
  try {
    isAvailable = await isAttestationServiceAvailable();
  } catch {
    return {};
  }
  if (!isAvailable) {
    return {};
  }

  const appName = getAppName();
  const requestHash = createRequestHash(requestConfig);

  // Ensure device is registered (runs registration flow if needed)
  let keyId;
  try {
    keyId = await ensureIOSRegistered();
  } catch (registrationError) {
    console.warn(
      '[integrity] iOS registration failed:',
      registrationError?.message,
    );
    return {};
  }

  // First attempt: sign the request hash with the hardware key.
  // Serialized so concurrent requests produce ascending sign counts.
  try {
    const assertion = await generateSerializedAssertion(requestHash, keyId);
    return {
      [INTEGRITY_HEADERS.appName]: appName,
      [INTEGRITY_HEADERS.proof]: assertion,
      [INTEGRITY_HEADERS.keyId]: keyId,
    };
  } catch (firstError) {
    console.warn(
      '[integrity] iOS assertion failed, re-registering:',
      firstError?.message,
    );

    // Rotate: clear stored registration, run fresh challenge + register
    // await clearIOSRegistration();

    // let freshKeyId;
    // try {
    //   freshKeyId = await ensureIOSRegistered();
    // } catch (rotationError) {
    //   console.warn(
    //     '[integrity] iOS re-registration failed:',
    //     rotationError?.message,
    //   );
    //   return {};
    // }
    //
    // try {
    //   const assertion = await generateSerializedAssertion(
    //     requestHash,
    //     freshKeyId,
    //   );
    //   return {
    //     [INTEGRITY_HEADERS.appName]: appName,
    //     [INTEGRITY_HEADERS.proof]: assertion,
    //     [INTEGRITY_HEADERS.keyId]: freshKeyId,
    //   };
    // } catch (retryError) {
    //   console.warn(
    //     '[integrity] iOS assertion failed after re-registration:',
    //     retryError?.message,
    //   );
    //   return {};
    // }
  }
};

// ─── Android: per-request integrity headers ───────────────────────────────────

const prepareAndroidIntegrity = async () => {
  if (!ANDROID_PROJECT_NUMBER) {
    return false;
  }

  const isAvailable = await isPlayServicesAvailable();
  if (!isAvailable) {
    return false;
  }

  if (!androidPreparePromise) {
    androidPreparePromise = prepareIntegrityToken(ANDROID_PROJECT_NUMBER).catch(
      err => {
        androidPreparePromise = null;
        throw err;
      },
    );
  }

  await androidPreparePromise;
  return true;
};

const createAndroidIntegrityHeaders = async requestConfig => {
  const appName = getAppName();

  // kimlwallet-android is not published to the Play Store — bypass entirely
  if (appName === 'kimlwallet-android') {
    return {};
  }

  let isReady = false;
  try {
    isReady = await prepareAndroidIntegrity();
  } catch (err) {
    console.warn('[integrity] Android prepare failed:', err?.message);
    return {};
  }
  if (!isReady) {
    return {};
  }

  const requestHash = createRequestHash(requestConfig);
  let integrityToken;
  try {
    integrityToken = await requestIntegrityToken(requestHash);
  } catch (err) {
    console.warn('[integrity] Android token request failed:', err?.message);
    // Reset prepare promise so the next request re-prepares from scratch
    androidPreparePromise = null;
    return {};
  }

  if (!integrityToken) {
    return {};
  }

  return {
    [INTEGRITY_HEADERS.appName]: appName,
    [INTEGRITY_HEADERS.proof]: integrityToken,
    // No keyId for Android — Play Integrity tokens are self-contained
  };
};

// ─── Unified header builder ───────────────────────────────────────────────────

const getIntegrityHeaders = async requestConfig => {
  if (Platform.OS === 'ios') {
    return createIOSIntegrityHeaders(requestConfig);
  }
  if (Platform.OS === 'android') {
    return createAndroidIntegrityHeaders(requestConfig);
  }
  return {};
};

// ─── 401/403 integrity rejection detection ────────────────────────────────────
//
// When the CF Worker rejects an iOS assertion (e.g. sign count mismatch after
// Redis flush, or device re-installed), the response interceptor clears the
// local registration so the next request triggers fresh registration.

const INTEGRITY_ERROR_KEYWORDS = [
  'attestation',
  'assertion',
  'integrity',
  'signcount',
  'sign_count',
  'device not',
  'device_not_found',
  'sign count conflict',
];

const isIntegrityRejection = error => {
  const status = error?.response?.status;
  if (status !== 401 && status !== 403 && status !== 409) {
    return false;
  }
  const message = String(
    error?.response?.data?.message || error?.response?.data?.error || '',
  ).toLowerCase();
  return INTEGRITY_ERROR_KEYWORDS.some(kw => message.includes(kw));
};

// ─── Public API ───────────────────────────────────────────────────────────────

// Call once at app startup (from MainApp.js) to register the Axios interceptors.
export const setupDokApiIntegrity = dokApi => {
  if (requestInterceptorId !== null) {
    return;
  }

  requestInterceptorId = dokApi.interceptors.request.use(
    async requestConfig => {
      const label = `${requestConfig?.method?.toUpperCase()} ${
        requestConfig?.url
      }`;
      if (requestConfig?.skipIntegrity) {
        return requestConfig;
      }

      // Block until initializeDokApiIntegrity() finishes (iOS registration /
      // Android prepare). Guards any DokApi caller outside the integrityReady gate.
      if (integrityInitPromise) {
        await integrityInitPromise;
      }

      const headers = await getIntegrityHeaders(requestConfig);
      if (!Object.keys(headers).length) {
        return requestConfig;
      }

      requestConfig.headers = requestConfig.headers ?? {};
      Object.assign(requestConfig.headers, headers);
      return requestConfig;
    },
    error => Promise.reject(error),
  );

  responseInterceptorId = dokApi.interceptors.response.use(
    response => response,
    async error => {
      if (isIntegrityRejection(error) && !error.config?._integrityRetried) {
        if (Platform.OS === 'ios') {
          const errorCode = error?.response?.data?.code;

          if (errorCode === 'SIGN_COUNT_CONFLICT') {
            // Backend uses WHERE sign_count < newCount, so this should be rare.
            // Just retry — the serialized assertion chain will produce a higher count.
            console.warn(
              '[integrity] SIGN_COUNT_CONFLICT — retrying without re-registration',
            );
          } else if (
            !iosRegistrationPromise &&
            !registrationPermanentlyFailed
          ) {
            // DEVICE_NOT_FOUND / ASSERTION_FAILED: re-register.
            // Set iosRegistrationPromise SYNCHRONOUSLY before any await so that
            // concurrent response interceptors see it as non-null and skip —
            // preventing duplicate re-registrations.
            console.warn(
              '[integrity] integrity rejected — starting re-registration',
            );
            iosRegistrationPromise = clearIOSRegistration()
              .then(() => registerIOSDevice())
              .catch(err => {
                registrationPermanentlyFailed = true;
                console.error(
                  '[integrity] re-registration failed, marked permanent:',
                  err?.message,
                );
                throw err;
              })
              .finally(() => {
                iosRegistrationPromise = null;
              });
          } else if (registrationPermanentlyFailed) {
            console.warn(
              '[integrity] integrity rejected but registration permanently failed — skipping re-registration',
            );
          } else {
            console.warn(
              '[integrity] integrity rejected — re-registration already in progress, joining',
            );
          }
        } else if (Platform.OS === 'android') {
          console.warn(
            '[integrity] CF Worker rejected Android token — resetting prepare promise and retrying',
          );
          androidPreparePromise = null;
        }

        // Retry once. The request interceptor calls ensureIOSRegistered() which
        // joins iosRegistrationPromise (set above) and waits for the new keyId.
        error.config._integrityRetried = true;
        return dokApi.request(error.config);
      }

      return Promise.reject(error);
    },
  );
};

// Called once at app startup (from MainApp.js).
// Android: warms the Play Integrity token provider.
// iOS: fully completes device registration (challenge → attest → register) before resolving,
// so the integrityReady gate in MainApp only opens after the handshake is done.
const _doInitialize = async () => {
  if (Platform.OS === 'android') {
    // kimlwallet-android: skip entirely (not on Play Store)
    if (getAppName() === 'kimlwallet-android') {
      return;
    }
    try {
      await prepareAndroidIntegrity();
    } catch (error) {
      console.error(
        '[integrity] Failed to warm Android integrity token provider',
        error,
      );
    }
    return;
  }

  if (Platform.OS === 'ios') {
    // Block until device registration (challenge → attest → register) is complete
    // so that integrityReady fires only after the handshake is done. This prevents
    // Main from mounting and dispatching API calls before the keyId exists.
    try {
      const isAvailable = await isAttestationServiceAvailable();

      if (isAvailable) {
        await ensureIOSRegistered();
      }
    } catch (err) {
      // Registration failed — app continues without integrity headers.
      // The request interceptor will retry registration on first use.
      console.error('[integrity] iOS pre-registration failed:', err?.message);
    }
  }
};

export const initializeDokApiIntegrity = async () => {
  integrityInitPromise = _doInitialize();
  try {
    await integrityInitPromise;
  } finally {
    integrityInitPromise = null;
  }
};
