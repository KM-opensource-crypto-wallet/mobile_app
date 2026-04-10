import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
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

const INTEGRITY_HEADERS = {
  proof: 'x-integrity-proof',
  platform: 'x-integrity-platform',
  attestation: 'x-integrity-attestation',
  nonce: 'x-integrity-nonce',
  keyId: 'x-integrity-key-id',
  appId: 'x-integrity-app-id',
};

const INTEGRITY_STORAGE_KEYS = {
  iosHardwareKey: 'integrity_ios_hardware_key',
  iosAttestation: 'integrity_ios_attestation',
  iosNonce: 'integrity_ios_nonce',
};

const storageOptions = {
  accessControl: 'none',
  keychainService: process.env.REDUX_KEYCHAIN_NAME,
};

const ANDROID_PROJECT_NUMBER =
  process.env.DOK_ANDROID_PLAY_INTEGRITY_PROJECT_NUMBER || '';

let requestInterceptorId = null;
let androidPreparePromise = null;

const getAppId = () => DeviceInfo.getBundleId();

const getStorageValue = key => getItem(key, storageOptions);
const setStorageValue = (key, value) => setItem(key, value, storageOptions);
const removeStorageValue = key => deleteItem(key, storageOptions);

// Must match BE: SHA256(METHOD\nPATH\nRAW_BODY)
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

const getOrCreateHardwareKey = async () => {
  const existingKey = await getStorageValue(
    INTEGRITY_STORAGE_KEYS.iosHardwareKey,
  );
  if (existingKey) {
    return existingKey;
  }

  const newKey = await generateHardwareKey();
  await setStorageValue(INTEGRITY_STORAGE_KEYS.iosHardwareKey, newKey);
  return newKey;
};

const getOrCreateAttestation = async keyId => {
  const existingAttestation = await getStorageValue(
    INTEGRITY_STORAGE_KEYS.iosAttestation,
  );
  const existingNonce = await getStorageValue(INTEGRITY_STORAGE_KEYS.iosNonce);

  if (existingAttestation && existingNonce) {
    return {attestation: existingAttestation, nonce: existingNonce};
  }

  const nonce = crypto.randomBytes(32).toString('base64');
  const attestation = await getAttestation(nonce, keyId);

  await setStorageValue(INTEGRITY_STORAGE_KEYS.iosAttestation, attestation);
  await setStorageValue(INTEGRITY_STORAGE_KEYS.iosNonce, nonce);

  return {attestation, nonce};
};

const createFreshKeyAndAttestation = async () => {
  await removeStorageValue(INTEGRITY_STORAGE_KEYS.iosHardwareKey);
  await removeStorageValue(INTEGRITY_STORAGE_KEYS.iosAttestation);
  await removeStorageValue(INTEGRITY_STORAGE_KEYS.iosNonce);

  const keyId = await getOrCreateHardwareKey();
  const {attestation, nonce} = await getOrCreateAttestation(keyId);
  return {keyId, attestation, nonce};
};

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
      error => {
        androidPreparePromise = null;
        throw error;
      },
    );
  }

  await androidPreparePromise;
  return true;
};

const createAndroidIntegrityHeaders = async requestConfig => {
  const isReady = await prepareAndroidIntegrity();
  if (!isReady) {
    return {};
  }

  const requestHash = createRequestHash(requestConfig);
  const integrityToken = await requestIntegrityToken(requestHash);

  if (!integrityToken) {
    return {};
  }

  return {
    [INTEGRITY_HEADERS.platform]: 'android',
    [INTEGRITY_HEADERS.proof]: integrityToken,
    [INTEGRITY_HEADERS.appId]: getAppId(),
  };
};

const createIOSIntegrityHeaders = async requestConfig => {
  let isAvailable = false;
  try {
    isAvailable = await isAttestationServiceAvailable();
  } catch (_) {
    return {};
  }
  if (!isAvailable) {
    return {};
  }

  let keyId = await getOrCreateHardwareKey();
  let {attestation, nonce} = await getOrCreateAttestation(keyId);
  const requestHash = createRequestHash(requestConfig);

  try {
    const assertion = await generateHardwareSignatureWithAssertion(
      requestHash,
      keyId,
    );

    return {
      [INTEGRITY_HEADERS.platform]: 'ios',
      [INTEGRITY_HEADERS.proof]: assertion,
      [INTEGRITY_HEADERS.attestation]: attestation,
      [INTEGRITY_HEADERS.nonce]: nonce,
      [INTEGRITY_HEADERS.keyId]: keyId,
      [INTEGRITY_HEADERS.appId]: getAppId(),
    };
  } catch (error) {
    const fresh = await createFreshKeyAndAttestation();
    keyId = fresh.keyId;
    attestation = fresh.attestation;
    nonce = fresh.nonce;

    const assertion = await generateHardwareSignatureWithAssertion(
      requestHash,
      keyId,
    );

    return {
      [INTEGRITY_HEADERS.platform]: 'ios',
      [INTEGRITY_HEADERS.proof]: assertion,
      [INTEGRITY_HEADERS.attestation]: attestation,
      [INTEGRITY_HEADERS.nonce]: nonce,
      [INTEGRITY_HEADERS.keyId]: keyId,
      [INTEGRITY_HEADERS.appId]: getAppId(),
    };
  }
};

const getIntegrityHeaders = async (dokApi, requestConfig) => {
  if (Platform.OS === 'ios') {
    return createIOSIntegrityHeaders(requestConfig);
  }

  if (Platform.OS === 'android') {
    return createAndroidIntegrityHeaders(requestConfig);
  }

  return {};
};

export const setupDokApiIntegrity = dokApi => {
  if (requestInterceptorId !== null) {
    return;
  }

  requestInterceptorId = dokApi.interceptors.request.use(
    async requestConfig => {
      if (requestConfig?.skipIntegrity) {
        return requestConfig;
      }

      const integrityHeaders = await getIntegrityHeaders(dokApi, requestConfig);
      if (!Object.keys(integrityHeaders).length) {
        return requestConfig;
      }

      requestConfig.headers = requestConfig.headers || {};
      Object.assign(requestConfig.headers, integrityHeaders);
      return requestConfig;
    },
    error => Promise.reject(error),
  );
};

export const initializeDokApiIntegrity = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await prepareAndroidIntegrity();
  } catch (error) {
    console.error('Failed to warm Android integrity token provider', error);
  }
};
