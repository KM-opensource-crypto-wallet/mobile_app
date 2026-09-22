// Opens the Tier 1 state store (MMKV, AES-256, key held in the secure store)
// exactly once per JS runtime and runs the one-time migrations. redux-persist's
// storage adapter awaits this, so the redux `store`/`persistor` stay
// synchronous exports and none of their import sites change.
//
// Order:
//   1. reinstall detection (stale Keychain items, no MMKV file)
//   2. MMKV key from the secure store (created on first run)
//   3. open MMKV
//   4. persist:root2 → per-slice + vault migration when schemaVersion is 0
//      (the blob is read from the secure store, or on Android from the
//      pre-RNSI-5 SharedPreferences — see migrateLegacyRoot2.readLegacyRoot)
//
// A failure in 4 is fatal: the promise stays rejected (no retry loop through
// the 11 slice reads) and App.js shows the storage error screen. Only an
// `unavailable` secure store (Keystore locked before first device unlock, in
// the headless task) clears the memo so the next call can retry.
import {createMMKV, existsMMKV} from 'react-native-mmkv';
import * as secureStore from 'security/secureStore';
import {randomBytes} from 'security/vaultCrypto';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {base64Encode} from 'dok-wallet-blockchain-networks/security/bytes';
import {SECURE_STORE_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';
import {addBreadcrumb} from 'services/logger';

export const STATE_MMKV_ID = 'dok.state';

export const STORAGE_KEYS = Object.freeze({
  // secure store
  mmkvKey: 'storage.mmkvKey',
  // MMKV
  installId: 'storage.installId',
  schemaVersion: 'storage.schemaVersion',
  migratedAt: 'storage.migratedAt',
  legacyRetainedAt: 'storage.legacyRetainedAt',
});

export const SCHEMA_VERSION = Object.freeze({
  legacy: 0, // only persist:root2 exists (or nothing yet)
  migrated: 2, // per-slice MMKV + vault written, legacy retained
  finalized: 3, // legacy deleted (or never existed)
});

// 24 random bytes → 32 base64 chars: 192 bits of entropy inside MMKV's
// 32-byte maximum for a string encryption key.
export const MMKV_KEY_BYTES = 24;
export const generateMmkvKey = () => base64Encode(randomBytes(MMKV_KEY_BYTES));

let bootstrapPromise = null;
let instance = null;
let context = 'foreground';
let lastRunContext = null;

/** `'headless'` from the notifee background handler, before the store loads. */
export const setBootstrapContext = value => {
  context = value;
};
export const getBootstrapContext = () => context;

const openStateStore = encryptionKey =>
  createMMKV({id: STATE_MMKV_ID, encryptionKey, encryptionType: 'AES-256'});

/**
 * iOS Keychain items survive an uninstall; the MMKV file does not. A missing
 * state file next to existing vault items means the keychain is stale from a
 * previous install: wipe it so the new install starts clean instead of
 * inheriting a wrapped DEK no state refers to (spec §12.3.2).
 */
const detectReinstall = async () => {
  if (existsMMKV(STATE_MMKV_ID)) {
    return false;
  }
  if (!(await vault.hasVault())) {
    return false;
  }
  await vault.destroy();
  await secureStore.remove(STORAGE_KEYS.mmkvKey);
  addBreadcrumb('storage', 'storage.reinstall_detected', {}, 'warning');
  return true;
};

const getOrCreateMmkvKey = async () => {
  let key = await secureStore.get(STORAGE_KEYS.mmkvKey);
  if (!key) {
    key = generateMmkvKey();
    await secureStore.set(STORAGE_KEYS.mmkvKey, key);
  }
  return key;
};

const readSchemaVersion = mmkv =>
  mmkv.getNumber(STORAGE_KEYS.schemaVersion) ?? SCHEMA_VERSION.legacy;

const hasPersistedSlices = mmkv =>
  mmkv.getAllKeys().some(key => key.startsWith('persist:'));

const runMigrations = async mmkv => {
  if (readSchemaVersion(mmkv) !== SCHEMA_VERSION.legacy) {
    return;
  }
  // Required lazily: the migrator imports the vault and the wipe helpers.
  const {hasLegacyRoot, migrateLegacyRoot2} = require('./migrateLegacyRoot2');
  if (await hasLegacyRoot()) {
    await migrateLegacyRoot2({mmkv, context});
    return;
  }
  // No legacy blob: either a fresh install or per-slice data whose version
  // marker was lost. Either way there is nothing to migrate or finalise, and
  // marking it prevents a stray legacy blob from ever overwriting live data.
  mmkv.set(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION.finalized);
  if (hasPersistedSlices(mmkv)) {
    addBreadcrumb('storage', 'storage.schema_marker_restored', {}, 'warning');
  }
};

const run = async () => {
  const startedAt = Date.now();
  lastRunContext = context;
  const reinstalled = await detectReinstall();
  const key = await getOrCreateMmkvKey();
  const mmkv = openStateStore(key);
  if (!mmkv.contains(STORAGE_KEYS.installId)) {
    mmkv.set(STORAGE_KEYS.installId, base64Encode(randomBytes(12)));
  }
  await runMigrations(mmkv);
  instance = mmkv;
  addBreadcrumb(
    'storage',
    'storage.bootstrapped',
    {
      ms: Date.now() - startedAt,
      reinstalled,
      context,
      schemaVersion: readSchemaVersion(mmkv),
    },
    'debug',
  );
  return mmkv;
};

/**
 * Memoised. Transient failures (`unavailable`) clear the memo so the next
 * call retries; anything else stays rejected until resetBootstrap().
 */
export const bootstrapStorage = () => {
  // A headless run only wrote the non-secret slices (no KDF); when the same
  // JS runtime later comes to the foreground, run the full migration.
  if (
    bootstrapPromise &&
    lastRunContext === 'headless' &&
    context !== 'headless'
  ) {
    bootstrapPromise = null;
  }
  if (!bootstrapPromise) {
    bootstrapPromise = run().catch(error => {
      instance = null;
      if (error?.code === SECURE_STORE_ERROR_CODES.UNAVAILABLE) {
        bootstrapPromise = null;
      }
      throw error;
    });
  }
  return bootstrapPromise;
};

/** Synchronous access after bootstrap; throws before it. */
export const getStateStore = () => {
  if (!instance) {
    throw new Error('State store is not open yet; await bootstrapStorage()');
  }
  return instance;
};

export const isStorageReady = () => instance !== null;

export const getSchemaVersion = async () =>
  readSchemaVersion(await bootstrapStorage());

export const setSchemaVersion = async version => {
  (await bootstrapStorage()).set(STORAGE_KEYS.schemaVersion, version);
};

/** Used by wipeAllLocalData and the error screen's Retry. */
export const resetBootstrap = () => {
  bootstrapPromise = null;
  instance = null;
};
