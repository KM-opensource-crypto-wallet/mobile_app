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
import {NativeModules} from 'react-native';

const {AttestationModule} = NativeModules;
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
  androidKeyId: 'integrity_android_key_id', // server-assigned fingerprint key ID
  androidRegistered: 'integrity_android_registered', // stored as the string 'true'
};

// ─── Config ───────────────────────────────────────────────────────────────────

const ATTEST_WORKER_URL = config.ATTEST_WORKER_BASE_URL.replace(/\/$/, '');
const ANDROID_PROJECT_NUMBER =
  process.env.DOK_ANDROID_PLAY_INTEGRITY_PROJECT_NUMBER ?? '';

// ─── Module-level state ───────────────────────────────────────────────────────

let requestInterceptorId = null;
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
// Per-platform permanent failure flags.
// Keeps iOS and Android failures isolated so one platform's failure
// doesn't block the other platform's registration in the same session.
let iosRegistrationPermanentlyFailed = false;
let androidRegistrationPermanentlyFailed = false;

// ─── In-memory key ID caches ──────────────────────────────────────────────────
//
// After first successful registration (or storage read), the keyId is held in
// memory so subsequent API requests skip 2 storage reads per call.
// Cleared on re-registration or key rotation so the next call re-reads storage.
let cachedIosKeyId = null;
let cachedAndroidKeyId = null;

// isAttestationServiceAvailable() result — does not change within an app session.
// Cached after first check to avoid a native async call on every iOS request.
let iosAttestationAvailable = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const storageOptions = {
  accessControl: 'none',
  keychainService: process.env.REDUX_KEYCHAIN_NAME,
};

// On Android react-native-sensitive-info throws when a key doesn't exist
// (rather than returning null like iOS does). Wrapping in try/catch normalises
// the behaviour across platforms so callers can simply check for null.
const getStorageValue = async key => {
  try {
    return await getItem(key, storageOptions);
  } catch {
    return null;
  }
};
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
  cachedIosKeyId = null;
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
      detail = err?.detail ?? err?.error ?? '';
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
  if (iosRegistrationPermanentlyFailed) {
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

  // Memory cache: skip storage reads for every request after first registration.
  if (cachedIosKeyId) {
    return cachedIosKeyId;
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
    cachedIosKeyId = storedKeyId;
    return storedKeyId;
  }

  iosRegistrationPromise = registerIOSDevice()
    .then(keyId => {
      cachedIosKeyId = keyId;
      return keyId;
    })
    .catch(err => {
      // Mark permanently failed so future calls skip registration entirely.
      // .catch before .finally ensures the rejection re-propagates to callers.
      iosRegistrationPermanentlyFailed = true;
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
  // Cache availability check — result never changes within an app session.
  if (iosAttestationAvailable === null) {
    try {
      iosAttestationAvailable = await isAttestationServiceAvailable();
    } catch {
      iosAttestationAvailable = false;
    }
  }
  if (!iosAttestationAvailable) {
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

    // Rotate: clear stored registration so the next request triggers fresh
    // challenge + register. Return {} for this request — x-app-name is still
    // sent by the interceptor; the proof will be present on the retry.
    await clearIOSRegistration();
    return {};
  }
};

// ─── kimlwallet-android: Keystore-backed ECDSA registration ──────────────────
//
// Mirrors registerIOSDevice exactly — same flow, same storage pattern.
// Uses AttestationModule (native Kotlin) instead of @pagopa/io-react-native-integrity.

const registerAndroidDevice = async () => {
  const appName = getAppName();

  if (!ATTEST_WORKER_URL) {
    throw new Error('ATTEST_WORKER_URL is not configured');
  }

  if (!AttestationModule) {
    throw new Error(
      'AttestationModule native module is not available — rebuild the app to link it',
    );
  }

  // 1. Request a server-side challenge
  const challengeResp = await fetch(`${ATTEST_WORKER_URL}/attest/challenge`, {
    method: 'GET',
    headers: {'x-app-name': appName},
  });

  if (!challengeResp.ok) {
    throw new Error(`Challenge request failed: ${challengeResp.status}`);
  }

  const challengeJson = await challengeResp.json();
  const challengeId = challengeJson.challengeId;
  const challenge = challengeJson.challenge;

  if (typeof challenge !== 'string' || !challenge) {
    throw new Error(
      `Challenge response missing 'challenge' field — got: ${JSON.stringify(
        challengeJson,
      )}`,
    );
  }

  // 2. Generate a fresh Android Keystore EC key pair with the server challenge
  //    embedded via setAttestationChallenge(). This produces a certificate chain
  //    rooted at Google's hardware CA — emulators cannot replicate it.
  let keyId, publicKey, apkHash, certChain;
  try {
    ({keyId, publicKey, apkHash, certChain} = await AttestationModule.register(
      challenge,
    ));
  } catch (nativeErr) {
    throw new Error(
      `AttestationModule.register failed: ${nativeErr?.message ?? nativeErr}`,
    );
  }

  // 3. Sign "challenge:apkHash" with the Keystore-backed private key.
  // Android SHA256withECDSA applies SHA-256 internally — the CF Worker must
  // verify with crypto.verify('SHA256', Buffer.from(data,'utf8'), spkiKey, derSig).
  const dataToSign = `${challenge}:${apkHash}`;
  let attestation;
  try {
    attestation = await AttestationModule.sign(dataToSign);
  } catch (signErr) {
    throw new Error(
      `AttestationModule.sign failed: ${signErr?.message ?? signErr}`,
    );
  }

  // 4. Register with CF Worker — Worker verifies ECDSA sig, APK hash, and cert chain
  const registerResp = await fetch(`${ATTEST_WORKER_URL}/attest/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-name': appName,
      'x-platform': 'android',
    },
    body: JSON.stringify({
      keyId,
      attestation,
      challengeId,
      publicKey,
      apkHash,
      certChain,
    }),
  });

  if (!registerResp.ok) {
    let detail = '';
    try {
      const err = await registerResp.json();
      detail = err?.detail ?? err?.error ?? '';
    } catch {
      // ignore parse error
    }
    throw new Error(`Registration failed (${registerResp.status}): ${detail}`);
  }

  // 5. Persist server-assigned key ID (fingerprint of publicKey) and registration flag
  const {keyId: deviceKeyId} = await registerResp.json();
  await setStorageValue(INTEGRITY_STORAGE_KEYS.androidKeyId, deviceKeyId);
  await setStorageValue(INTEGRITY_STORAGE_KEYS.androidRegistered, 'true');

  return deviceKeyId;
};

// Serializes concurrent kimlwallet-android registration attempts.
let androidRegistrationPromise = null;

const clearAndroidRegistration = async () => {
  cachedAndroidKeyId = null;
  await removeStorageValue(INTEGRITY_STORAGE_KEYS.androidKeyId);
  await removeStorageValue(INTEGRITY_STORAGE_KEYS.androidRegistered);
};

const ensureKimlwalletAndroidRegistered = async () => {
  if (androidRegistrationPermanentlyFailed) {
    throw new Error('Android registration permanently failed this session');
  }

  if (androidRegistrationPromise) {
    return androidRegistrationPromise;
  }

  // Memory cache: skip storage reads for every request after first registration.
  if (cachedAndroidKeyId) {
    return cachedAndroidKeyId;
  }

  const [storedKeyId, isRegistered] = await Promise.all([
    getStorageValue(INTEGRITY_STORAGE_KEYS.androidKeyId),
    getStorageValue(INTEGRITY_STORAGE_KEYS.androidRegistered),
  ]);

  if (androidRegistrationPromise) {
    return androidRegistrationPromise;
  }

  if (storedKeyId && isRegistered === 'true') {
    cachedAndroidKeyId = storedKeyId;
    return storedKeyId;
  }

  androidRegistrationPromise = registerAndroidDevice()
    .then(keyId => {
      cachedAndroidKeyId = keyId;
      return keyId;
    })
    .catch(err => {
      androidRegistrationPermanentlyFailed = true;
      console.error(
        '[integrity] ensureKimlwalletAndroidRegistered: registration failed:',
        err?.message,
      );
      throw err;
    })
    .finally(() => {
      androidRegistrationPromise = null;
    });

  return androidRegistrationPromise;
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

// Per-request ECDSA headers for kimlwallet-android.
// Ensures device is registered, then signs a fresh nonce:ts pair.
const createKimlwalletAndroidHeaders = async () => {
  const appName = getAppName();

  let keyId;
  try {
    keyId = await ensureKimlwalletAndroidRegistered();
  } catch (err) {
    console.warn(
      '[integrity] kimlwallet-android registration failed:',
      err?.message,
    );
    return {};
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const ts = String(Math.floor(Date.now() / 1000));

  let sig;
  try {
    sig = await AttestationModule.sign(`${nonce}:${ts}`);
  } catch (err) {
    console.warn('[integrity] kimlwallet-android sign failed:', err?.message);
    return {};
  }

  return {
    [INTEGRITY_HEADERS.appName]: appName,
    [INTEGRITY_HEADERS.keyId]: keyId,
    [INTEGRITY_HEADERS.proof]: sig,
    'x-nonce': nonce,
    'x-ts': ts,
  };
};

const createAndroidIntegrityHeaders = async requestConfig => {
  const appName = getAppName();

  // kimlwallet-android: sideloaded — use Keystore-backed ECDSA instead of Play Integrity
  if (appName === 'kimlwallet-android') {
    return createKimlwalletAndroidHeaders();
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
      if (requestConfig?.skipIntegrity) {
        return requestConfig;
      }

      // Block until initializeDokApiIntegrity() finishes (iOS registration /
      // Android prepare). Guards any DokApi caller outside the integrityReady gate.
      if (integrityInitPromise) {
        await integrityInitPromise;
      }

      requestConfig.headers = requestConfig.headers ?? {};
      // Always attach x-app-name so the CF Worker can identify the app even
      // when a full integrity proof cannot be generated (e.g. simulator, Play
      // Services unavailable). The proof headers are added only when available.
      requestConfig.headers[INTEGRITY_HEADERS.appName] = getAppName();

      const headers = await getIntegrityHeaders(requestConfig);
      if (Object.keys(headers).length) {
        Object.assign(requestConfig.headers, headers);
      }
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
            !iosRegistrationPermanentlyFailed
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
                iosRegistrationPermanentlyFailed = true;
                console.error(
                  '[integrity] re-registration failed, marked permanent:',
                  err?.message,
                );
                throw err;
              })
              .finally(() => {
                iosRegistrationPromise = null;
              });
          } else if (iosRegistrationPermanentlyFailed) {
            console.warn(
              '[integrity] integrity rejected but registration permanently failed — skipping re-registration',
            );
          } else {
            console.warn(
              '[integrity] integrity rejected — re-registration already in progress, joining',
            );
          }
        } else if (Platform.OS === 'android') {
          if (getAppName() === 'kimlwallet-android') {
            // DEVICE_NOT_FOUND: server lost the key record — clear local state
            // and allow re-registration on the next ensureKimlwalletAndroidRegistered call.
            console.warn(
              '[integrity] kimlwallet-android rejected — clearing registration and retrying',
            );
            androidRegistrationPermanentlyFailed = false;
            clearAndroidRegistration();
          } else {
            console.warn(
              '[integrity] CF Worker rejected Android token — resetting prepare promise and retrying',
            );
            androidPreparePromise = null;
          }
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
    // kimlwallet-android: sideloaded — run one-time Keystore registration
    if (getAppName() === 'kimlwallet-android') {
      try {
        await ensureKimlwalletAndroidRegistered();
      } catch (error) {
        console.error(
          '[integrity] Failed to register kimlwallet-android device',
          error,
        );
      }
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
