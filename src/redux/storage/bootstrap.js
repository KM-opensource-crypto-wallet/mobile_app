// Opens the Tier 1 state store (MMKV, AES-256, key held in the secure store)
// exactly once per JS runtime and runs the one-time migrations. redux-persist's
// storage adapter awaits this, so the redux `store`/`persistor` stay
// synchronous exports and none of their import sites change.
//
// Order:
//   1. reinstall detection (no MMKV file): the stale MMKV key goes, the vault
//      STAYS so its wallets can be restored with the old password
//   2. MMKV key from the secure store (created on first run; never created
//      next to an existing encrypted file, which is set aside instead)
//   3. open MMKV (recover-on-error: a damaged file is repaired, not emptied)
//   4. persist:root2 → per-slice + vault migration when schemaVersion is 0
//   5. report a vault with no account (the store came back empty)
//
// Data-loss rule: nothing here ever deletes the vault or an encrypted state
// file. Every unusual outcome is a Sentry log (`storage.*`), not only a
// breadcrumb, so it can be traced without an error event.
//      (the blob is read from the secure store, or on Android from the
//      pre-RNSI-5 SharedPreferences — see migrateLegacyRoot2.readLegacyRoot)
//
// A failure in 4 is fatal: the promise stays rejected (no retry loop through
// the 11 slice reads) and App.js shows the storage error screen. Only an
// `unavailable` secure store (Keystore locked before first device unlock, in
// the headless task) clears the memo so the next call can retry.
import {createMMKV, existsMMKV} from 'react-native-mmkv';
import {DocumentDirectoryPath, exists, mkdir, moveFile} from 'react-native-fs';
import * as secureStore from 'security/secureStore';
import {randomBytes} from 'security/vaultCrypto';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {base64Encode} from 'dok-wallet-blockchain-networks/security/bytes';
import {SECURE_STORE_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';
import {addBreadcrumb, captureError, logger} from 'services/logger';

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

// MMKV's default for a CRC or file-length error is to discard the whole file
// silently. Recover keeps every entry that still reads back.
export const STATE_RECOVERY_STRATEGY = 'recover-on-error';

const openStateStore = encryptionKey =>
  createMMKV({
    id: STATE_MMKV_ID,
    encryptionKey,
    encryptionType: 'AES-256',
    recoveryStrategy: STATE_RECOVERY_STRATEGY,
  });

// Both platforms keep MMKV files in `<documents>/mmkv/<id>` plus `.crc`.
const STATE_DIR = `${DocumentDirectoryPath}/mmkv`;
export const UNREADABLE_STATE_DIR = `${DocumentDirectoryPath}/mmkv-unreadable`;

/**
 * Logs every storage incident as a Sentry log (searchable without an error
 * event) and as a breadcrumb for the next error report.
 */
const report = (event, data = {}, level = 'warn') => {
  addBreadcrumb('storage', event, data, level === 'warn' ? 'warning' : level);
  logger[level](event, {context, ...data});
};

/**
 * iOS Keychain items survive an uninstall; the MMKV file does not. A missing
 * state file next to existing vault items is a reinstall, or a state file that
 * disappeared. Only the MMKV key is stale; the vault keeps the wallets' keys
 * and the onboarding offers to restore them with the old password
 * (RestoreFromDevice). Registration replaces it only after the user agrees.
 */
const detectReinstall = async () => {
  if (existsMMKV(STATE_MMKV_ID)) {
    return false;
  }
  if (!(await vault.hasVault())) {
    return false;
  }
  await secureStore.remove(STORAGE_KEYS.mmkvKey);
  report('storage.reinstall_detected', {vaultKept: true});
  return true;
};

/**
 * The encrypted state file exists but its key is gone. Opening it with a new
 * key would read nothing and the next write would overwrite it, so the file
 * is moved aside (kept, never deleted) before a fresh store is created.
 */
const setAsideUnreadableStore = async () => {
  const stamp = Date.now();
  await mkdir(UNREADABLE_STATE_DIR);
  for (const suffix of ['', '.crc']) {
    const from = `${STATE_DIR}/${STATE_MMKV_ID}${suffix}`;
    if (await exists(from)) {
      await moveFile(
        from,
        `${UNREADABLE_STATE_DIR}/${STATE_MMKV_ID}-${stamp}${suffix}`,
      );
    }
  }
  if (existsMMKV(STATE_MMKV_ID)) {
    throw new Error('The unreadable state store could not be moved aside');
  }
};

const getOrCreateMmkvKey = async () => {
  let key = await secureStore.get(STORAGE_KEYS.mmkvKey);
  if (!key) {
    if (existsMMKV(STATE_MMKV_ID)) {
      captureError(new Error('State store exists without its key'), {
        tags: {area: 'storage', op: 'mmkv_key_missing'},
      });
      report('storage.key_missing_store_set_aside', {}, 'error');
      await setAsideUnreadableStore();
    }
    key = generateMmkvKey();
    await secureStore.set(STORAGE_KEYS.mmkvKey, key);
    report('storage.key_created', {}, 'info');
  }
  return key;
};

const persistedHasAccount = mmkv => {
  try {
    const raw = mmkv.getString('persist:auth');
    const value = raw ? JSON.parse(raw).hasAccount : undefined;
    return value === true || value === 'true';
  } catch {
    return false;
  }
};

/**
 * A vault with no account means the state store came back empty while the
 * keys survived: the case that used to end in onboarding and a new vault over
 * the old one. Reported as an error so it reaches Sentry with breadcrumbs.
 */
const reportVaultWithoutAccount = async (mmkv, reinstalled) => {
  if (persistedHasAccount(mmkv) || !(await vault.hasVault())) {
    return;
  }
  const data = {
    reinstalled,
    slices: mmkv.getAllKeys().filter(key => key.startsWith('persist:')).length,
  };
  report('storage.vault_without_account', data, 'error');
  captureError(new Error('Vault found without an account'), {
    tags: {area: 'storage', op: 'vault_without_account'},
    extra: data,
  });
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
    report('storage.schema_marker_restored');
  }
};

const run = async () => {
  const startedAt = Date.now();
  lastRunContext = context;
  const reinstalled = await detectReinstall();
  const key = await getOrCreateMmkvKey();
  const mmkv = openStateStore(key);
  if (!mmkv.contains(STORAGE_KEYS.installId)) {
    // A store without an install id is a fresh (or emptied) one.
    report('storage.new_store', {reinstalled}, 'info');
    mmkv.set(STORAGE_KEYS.installId, base64Encode(randomBytes(12)));
  }
  await runMigrations(mmkv);
  if (context !== 'headless') {
    await reportVaultWithoutAccount(mmkv, reinstalled);
  }
  instance = mmkv;
  const summary = {
    ms: Date.now() - startedAt,
    reinstalled,
    context,
    schemaVersion: readSchemaVersion(mmkv),
    hasAccount: persistedHasAccount(mmkv),
  };
  addBreadcrumb('storage', 'storage.bootstrapped', summary, 'debug');
  logger.info('storage.bootstrapped', summary);
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
