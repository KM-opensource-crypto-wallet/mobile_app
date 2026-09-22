// One-time migration of the legacy single redux-persist blob (`persist:root2`
// in react-native-sensitive-info under REDUX_KEYCHAIN_NAME) into per-slice
// MMKV envelopes plus the vault.
//
// State machine on MMKV `storage.schemaVersion` (spec §5):
//   0 legacy   → migrate; schemaVersion=2 is the LAST write, so a kill anywhere
//                before it redoes cleanly from the untouched legacy blob
//   2 migrated → new stores written, legacy retained
//   3 finalized→ legacy deleted after the first successful unlock proved the
//                new stores end to end
//
// In the notifee headless task there is no time budget for a 600k PBKDF2, so
// only the non-secret slices are written and the state machine stays at 0;
// the next foreground launch redoes everything (spec §12.3.5).
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {getFromService} from 'security/secureStore';
import {
  buildPersistEnvelope,
  parseLegacyRoot,
  parsePersistEnvelope,
  splitLegacyRoot,
  verifyMigration,
} from 'dok-wallet-blockchain-networks/redux/storage/legacyRootMigration';
import {addBreadcrumb, captureError, logger} from 'services/logger';
import {Platform} from 'react-native';
import {getLegacySecureValue} from 'myWallet/wallet.service';
import {SCHEMA_VERSION, STORAGE_KEYS} from './bootstrap';
import {
  LEGACY_KEYCHAIN_SERVICE,
  LEGACY_ROOT_KEY,
  LEGACY_SHARED_PREFERENCES,
  removeLegacyRootBlob,
} from './wipe';

export const MIGRATION_ERROR_CODES = Object.freeze({
  PARSE: 'migrate_parse',
  VERIFY: 'migrate_verify',
  // Android: the native react-native-sensitive-info 5.6.2 → 6.x re-shape
  // (SensitiveInfoV6Migration.kt) has not completed, so the legacy blob is
  // there but unreadable through RNSI 6. Retried natively on the next launch.
  NATIVE_STORE: 'migrate_native_store',
});

// Mirrors SensitiveInfoV6Migration.kt: the 5.6.2 SharedPreferences file and
// the marker it writes (string keys, readable through getLegacySecureValue).
// `entry.<service>::<key>` holds that entry's own outcome; it is committed
// only after the re-shaped data is, so it is the per-entry proof of success.
export const RNSI_LEGACY_PREFS = 'sensitive_info';
export const RNSI_V6_MARKER = Object.freeze({
  prefs: 'rnsi_v6_migration',
  error: 'error',
  entryPrefix: 'entry.',
  entryMigrated: 'migrated',
  entryExists: 'exists',
  entrySkipped: 'skipped',
});

const migrationError = (code, message, cause) =>
  Object.assign(new Error(message), {code, cause});

// Legacy wallets found next to an empty password (onboarding never finished,
// which resetWallet should make impossible). Their secrets are kept in memory
// for this session only; RegistrationScreen's createVault + the vault listener
// persist them once a password exists.
let orphanVaultPayload = null;
export const consumeOrphanVaultPayload = () => {
  const payload = orphanVaultPayload;
  orphanVaultPayload = null;
  return payload;
};

// null only when the blob is genuinely absent (E_NOT_FOUND, or the generic
// Android missing-key error confirmed by hasItem). Any other failure — Keystore
// unavailable, Keychain not yet readable, unknown — propagates so the bootstrap
// rejects and shows StorageErrorScreen, instead of runMigrations concluding
// "fresh install" and marking schemaVersion=3 over an un-migrated blob. An
// `unavailable` rejection is retried by the next bootstrapStorage() call.
//
// Pre-RNSI-5 Android builds kept the blob in plain SharedPreferences
// (REDUX_SHARED_PREFERENCE_NAME). It is read from there directly — copying it
// into the secure store first (the old App.js step) would hit RNSI 6's 1 MiB
// write limit on a large state and silently end in "no legacy blob". Like the
// keychain item, those preferences are retained until finalisation.
//
// RNSI 5.6.2 Android builds kept it in `sensitive_info` under
// "<service>::<key>"; RNSI 6 reads a different file, filled by the native
// re-shape in MainApplication.onCreate. If that re-shape has not completed the
// blob is invisible to RNSI 6 — never "absent": finalising here would strand
// the wallets for good, so the bootstrap rejects and the next launch retries.
export const readLegacyRoot = async () => {
  const fromSecureStore = await getFromService(
    LEGACY_ROOT_KEY,
    LEGACY_KEYCHAIN_SERVICE,
  );
  if (fromSecureStore != null || Platform.OS !== 'android') {
    return fromSecureStore;
  }
  if (LEGACY_SHARED_PREFERENCES) {
    const fromPreferences = await getLegacySecureValue(
      LEGACY_SHARED_PREFERENCES,
      LEGACY_ROOT_KEY,
    );
    if (fromPreferences) {
      return fromPreferences;
    }
  }
  await assertNativeStoreMigrated();
  return null;
};

const assertNativeStoreMigrated = async () => {
  const legacyEntryKey = `${LEGACY_KEYCHAIN_SERVICE}::${LEGACY_ROOT_KEY}`;
  const legacyEntry = await getLegacySecureValue(
    RNSI_LEGACY_PREFS,
    legacyEntryKey,
  );
  if (legacyEntry == null) {
    return;
  }
  const entryStatus = await getLegacySecureValue(
    RNSI_V6_MARKER.prefs,
    `${RNSI_V6_MARKER.entryPrefix}${legacyEntryKey}`,
  );
  if (
    entryStatus === RNSI_V6_MARKER.entryMigrated ||
    entryStatus === RNSI_V6_MARKER.entryExists
  ) {
    // This entry was re-shaped, then the 6.x item was deleted (finalised or
    // wiped); the retained 5.6.2 copy is dead ciphertext (its Keystore alias
    // went with it).
    return;
  }
  if (entryStatus === RNSI_V6_MARKER.entrySkipped) {
    // The native step ran but could not re-shape this entry (unparseable,
    // no ciphertext/IV, or user-authentication bound). Retrying will not
    // help; same handling as unreadable legacy data.
    const error = migrationError(
      MIGRATION_ERROR_CODES.PARSE,
      'Stored wallet data could not be moved to the new secure store',
    );
    captureError(error, {
      tags: {area: 'storage', op: 'migrate', step: 'native_store_skipped'},
    });
    throw error;
  }
  const nativeError = await getLegacySecureValue(
    RNSI_V6_MARKER.prefs,
    RNSI_V6_MARKER.error,
  );
  const error = migrationError(
    MIGRATION_ERROR_CODES.NATIVE_STORE,
    'Secure store upgrade has not completed',
    nativeError ? new Error(nativeError) : undefined,
  );
  captureError(error, {
    tags: {area: 'storage', op: 'migrate', step: 'native_store'},
    extra: {nativeError: nativeError || null},
  });
  throw error;
};

export const hasLegacyRoot = async () => (await readLegacyRoot()) != null;

const persistKey = sliceName => `persist:${sliceName}`;

const writeSlices = (mmkv, slices) => {
  for (const [name, state] of Object.entries(slices)) {
    mmkv.set(persistKey(name), buildPersistEnvelope(state));
  }
};

const breadcrumb = (step, data) =>
  addBreadcrumb('storage', 'storage.migration', {step, ...data}, 'info');

/**
 * Runs the whole migration against an open MMKV instance. Throws with a
 * `code` from MIGRATION_ERROR_CODES on corrupt legacy data or a failed
 * self-check; the caller must then block the app, never continue into an
 * empty store.
 */
export const migrateLegacyRoot2 = async ({mmkv, context = 'foreground'}) => {
  const startedAt = Date.now();
  const raw = await readLegacyRoot();
  if (raw == null) {
    return {status: 'none'};
  }

  let parsed;
  try {
    parsed = parseLegacyRoot(raw);
  } catch (error) {
    captureError(error, {
      tags: {area: 'storage', op: 'migrate', step: 'parse'},
    });
    throw migrationError(
      MIGRATION_ERROR_CODES.PARSE,
      'Stored wallet data could not be read',
      error,
    );
  }
  const {slices, vaultPayload, legacyWallets, password, counts} =
    splitLegacyRoot(parsed.slices);

  if (context === 'headless') {
    writeSlices(mmkv, slices);
    breadcrumb('partial', {
      ...counts,
      context,
      totalMs: Date.now() - startedAt,
    });
    return {status: 'partial', counts};
  }

  let kdfMs = 0;
  if (password) {
    // A kill after the vault write but before schemaVersion=2 leaves a vault
    // behind; the redo replaces it wholesale.
    if (await vault.hasVault()) {
      await vault.destroy();
    }
    const kdfStart = Date.now();
    await vault.createVault(password);
    kdfMs = Date.now() - kdfStart;
    await vault.saveSecrets(vaultPayload);
  } else if (counts.wallets > 0) {
    orphanVaultPayload = vaultPayload;
    captureError(new Error('Legacy wallets found without a password'), {
      level: 'warning',
      tags: {area: 'storage', op: 'migrate', step: 'orphan_wallets'},
      extra: {wallets: counts.wallets},
    });
  }

  writeSlices(mmkv, slices);

  // Self-verify against what was actually written before committing.
  const written = mmkv.getString(persistKey('wallets'));
  const verification = verifyMigration({
    // Normalized copy: carries the clientIds assigned to pre-clientId wallets.
    legacyWallets,
    migratedWallets: written ? parsePersistEnvelope(written) : undefined,
    decryptedVault: password ? await vault.readSecrets() : vaultPayload,
  });
  if (!verification.ok) {
    vault.lock();
    const error = migrationError(
      MIGRATION_ERROR_CODES.VERIFY,
      `Migration self-check failed: ${verification.problems.join('; ')}`,
    );
    captureError(error, {
      tags: {area: 'storage', op: 'migrate', step: 'verify'},
    });
    throw error;
  }

  // Never enrol biometrics here, on either platform. react-native-sensitive-info
  // evaluates an LAContext / BiometricPrompt on every biometric-protected
  // WRITE, and on iOS it silently falls back to the device passcode when
  // biometrics cannot be evaluated (nothing enrolled, locked out, simulator).
  // A boot-time OS prompt is never acceptable; unlockFlow.ensureBiometricEnrolled
  // creates the copy after the first password unlock, where a prompt is expected.
  vault.lock();

  const now = Date.now();
  mmkv.set(STORAGE_KEYS.migratedAt, now);
  mmkv.set(STORAGE_KEYS.legacyRetainedAt, now);
  mmkv.set(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION.migrated);

  const totalMs = Date.now() - startedAt;
  breadcrumb('done', {...counts, kdfMs, totalMs, context});
  logger.info('storage.migrated', {...counts, kdfMs, totalMs});
  return {status: 'migrated', counts, kdfMs, totalMs};
};

/**
 * 2 → 3. Called right after the first successful unlock: the hydrated store is
 * the end-to-end proof that the new stores work, so the legacy blob can go.
 * Returns true when finalised, false when there was nothing to do or the
 * hydrated wallets do not match what was persisted (reported, legacy kept).
 */
export const finalizeLegacyMigration = async ({mmkv, getState}) => {
  if (mmkv.getNumber(STORAGE_KEYS.schemaVersion) !== SCHEMA_VERSION.migrated) {
    return false;
  }
  const persistedRaw = mmkv.getString(persistKey('wallets'));
  const persistedIds = persistedRaw
    ? (parsePersistEnvelope(persistedRaw).allWallets || [])
        .map(w => w?.clientId)
        .sort()
    : [];
  const hydratedIds = (getState().wallets?.allWallets || [])
    .map(w => w?.clientId)
    .sort();
  if (JSON.stringify(persistedIds) !== JSON.stringify(hydratedIds)) {
    captureError(new Error('Hydrated wallets differ from persisted wallets'), {
      tags: {area: 'storage', op: 'migrate', step: 'finalize'},
      extra: {persisted: persistedIds.length, hydrated: hydratedIds.length},
    });
    return false;
  }
  await removeLegacyRootBlob();
  mmkv.set(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION.finalized);
  breadcrumb('finalized', {wallets: hydratedIds.length});
  return true;
};
