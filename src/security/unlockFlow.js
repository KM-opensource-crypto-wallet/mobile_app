// Login orchestration on top of the vault. Thunks, so screens `await
// dispatch(unlockWithPassword(pw))` and branch on the thrown VaultError code.
//
// completeUnlock: hydrate secrets into the wallets slice → refuse wallets that
// still have no key (vault.missing_secrets) → mark the session unlocked →
// finalise the legacy migration (2 → 3) → create the biometric copy of the DEK
// if the setting is on but the item is missing (Android after migration, or
// after an enrollment change invalidated it).
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {VAULT_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';
import {
  clearWalletSecrets,
  hydrateWalletSecrets,
  reassignCurrentWalletIfHidden,
  resetCoinsToDefaultAddressForPrivacyMode,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  vaultLocked,
  vaultUnlocked,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {getHasAccount} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import {isFingerprint} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {addBreadcrumb, captureError} from 'services/logger';
import {bootstrapStorage} from 'redux/storage/bootstrap';
import {
  commitOrphanLegacyMigration,
  consumeOrphanVaultPayload,
  finalizeLegacyMigration,
  peekOrphanVaultPayload,
} from 'redux/storage/migrateLegacyRoot2';
import {vaultSync} from 'redux/store';
import {BIOMETRIC_PROMPT} from './biometricPrompt';

export const UNLOCK_ERROR_CODES = Object.freeze({
  ...VAULT_ERROR_CODES,
  MISSING_SECRETS: 'missing_secrets',
  ACCOUNT_EXISTS: 'account_exists',
  VAULT_WRITE_FAILED: 'vault_write_failed',
});

export class AccountExistsError extends Error {
  constructor() {
    super('An account already exists on this device. Log in instead.');
    this.name = 'AccountExistsError';
    this.code = UNLOCK_ERROR_CODES.ACCOUNT_EXISTS;
  }
}

export class VaultWriteError extends Error {
  constructor() {
    super(
      'The wallet keys could not be written to secure storage. Please try again.',
    );
    this.name = 'VaultWriteError';
    this.code = UNLOCK_ERROR_CODES.VAULT_WRITE_FAILED;
  }
}

export class MissingSecretsError extends Error {
  constructor(clientIds) {
    super(
      `${clientIds.length} wallet(s) have no keys in the vault. Restore them from their seed phrase.`,
    );
    this.name = 'MissingSecretsError';
    this.code = UNLOCK_ERROR_CODES.MISSING_SECRETS;
    this.clientIds = clientIds;
  }
}

const hasAnyKey = wallet =>
  Boolean(wallet?.phrase) ||
  Boolean(wallet?.privateKey) ||
  (wallet?.coins || []).some(
    coin => coin?.privateKey || coin?.extendedPrivateKey,
  );

// Wallets that cannot sign anything after hydration. A wallet created in this
// session already has its keys in memory, so only vault-less *persisted*
// wallets show up here.
export const findWalletsWithoutKeys = allWallets =>
  (allWallets || [])
    .filter(w => w?.clientId && !hasAnyKey(w))
    .map(w => w.clientId);

const ensureBiometricEnrolled = async getState => {
  if (!isFingerprint(getState()) || !(await vault.isBiometricAvailable())) {
    return;
  }
  if (await vault.hasBiometric()) {
    return;
  }
  try {
    await vault.enableBiometric(BIOMETRIC_PROMPT);
    addBreadcrumb('auth', 'biometric.enrolled', {via: 'unlock'});
  } catch (error) {
    // User dismissed the prompt or the platform refused; password still works.
    captureError(error, {
      level: 'warning',
      tags: {area: 'vault', op: 'enable_biometric'},
    });
  }
};

// A failed unlock must not leave a half-open session behind (keys hydrated
// into the store, the vault holding the DEK) while the UI still shows the
// lock screen.
const rollbackUnlock = dispatch => {
  try {
    dispatch(clearWalletSecrets());
  } finally {
    vault.lock();
    dispatch(vaultLocked());
  }
};

const completeUnlock = async (dispatch, getState, payload, via) => {
  try {
    dispatch(hydrateWalletSecrets(payload));
    const missing = findWalletsWithoutKeys(getState().wallets?.allWallets);
    if (missing.length) {
      captureError(new Error('Wallets without secrets after unlock'), {
        tags: {area: 'vault', op: 'missing_secrets'},
        extra: {count: missing.length, via},
      });
      throw new MissingSecretsError(missing);
    }
  } catch (error) {
    rollbackUnlock(dispatch);
    throw error;
  }
  vaultSync.markSynced(payload);
  // Wallet housekeeping that needs the keys in place (was pre-unlock in main.js):
  // privacy mode re-points each coin to its default derive address AND that
  // address's key; hidden-wallet reassignment follows in the same tick.
  dispatch(resetCoinsToDefaultAddressForPrivacyMode());
  dispatch(reassignCurrentWalletIfHidden());
  dispatch(vaultUnlocked());
  addBreadcrumb('auth', 'vault.unlocked', {via});
  try {
    const mmkv = await bootstrapStorage();
    await finalizeLegacyMigration({mmkv, getState});
  } catch (error) {
    captureError(error, {
      tags: {area: 'storage', op: 'migrate', step: 'finalize'},
    });
  }
  await ensureBiometricEnrolled(getState);
};

/**
 * Registration: create the vault for a new account. Refused while an account
 * exists: an existing vault is only ever replaced through the explicit reset
 * flow (wipeAllLocalData, Forgot / too many attempts). The one vault this
 * replaces is a leftover from a wipe whose destroy step failed, where no
 * account remains. Legacy wallets that were migrated without a password have
 * their keys parked in memory; they are hydrated and written into the new
 * vault here, and only then is the migration's schemaVersion advanced, so a
 * kill before that redoes it. The parked keys are released only once both the
 * vault write and the commit succeeded: a failure keeps them parked for the
 * next Registration submit and closes the half-open session, exactly like a
 * failed unlock.
 */
export const createAccount = password => async (dispatch, getState) => {
  if (getHasAccount(getState())) {
    throw new AccountExistsError();
  }
  if (await vault.hasVault()) {
    await vault.destroy();
  }
  await vault.createVault(password);
  // Peek, never consume here: consuming before the write landed would make a
  // retry find nothing to migrate and leave the wallets without keys.
  const orphan = peekOrphanVaultPayload();
  if (orphan) {
    // reset() first: it also drops any pending snapshot, so calling it after
    // the hydrate would throw away the very write flush() is meant to land.
    vaultSync.reset();
    dispatch(hydrateWalletSecrets(orphan));
  }
  dispatch(vaultUnlocked());
  addBreadcrumb('auth', 'vault.created', {});
  // Same wallet housekeeping as completeUnlock (the master client id is set
  // at store load in main.js): orphaned legacy wallets need the privacy-mode
  // / hidden wallet passes that run on every unlock.
  dispatch(resetCoinsToDefaultAddressForPrivacyMode());
  dispatch(reassignCurrentWalletIfHidden());
  if (orphan) {
    try {
      // flush() never rejects; false means a write failed and its snapshot is
      // still dirty. Committing over that would advance schemaVersion with an
      // empty vault, and a kill before the retry lands loses the keys for good.
      if (!(await vaultSync.flush())) {
        throw new VaultWriteError();
      }
      commitOrphanLegacyMigration(await bootstrapStorage());
      consumeOrphanVaultPayload();
    } catch (error) {
      // Drop the dirty snapshot (its retry timer must not write into a vault
      // the next attempt destroys and recreates) and close the session; the
      // orphan payload stays parked for the retry.
      vaultSync.reset();
      rollbackUnlock(dispatch);
      throw error;
    }
  }
};

export const unlockWithPassword = password => async (dispatch, getState) => {
  const payload = await vault.unlockWithPassword(password);
  await completeUnlock(dispatch, getState, payload, 'password');
  // The vault re-wraps a stale KDF envelope during a password unlock but never
  // fails the unlock over it; if the write did not stick, say so here.
  if (await vault.needsKdfUpgrade().catch(() => false)) {
    captureError(new Error('KDF parameter upgrade did not persist'), {
      level: 'warning',
      tags: {area: 'vault', op: 'kdf_upgrade'},
    });
  }
};

export const unlockWithBiometric = () => async (dispatch, getState) => {
  const payload = await vault.unlockWithBiometric(BIOMETRIC_PROMPT);
  await completeUnlock(dispatch, getState, payload, 'biometric');
};

/**
 * 'unavailable' — no enrolled sensor on this device (or web): password only,
 *                 silently; 'not_enrolled' — sensor present but no biometric
 *                 copy of the key yet (first unlock after upgrade, or after an
 *                 enrollment change): password once, then it is created;
 * 'ready'       — the OS-prompt unlock path can run.
 */
export const getBiometricUnlockState = async () => {
  if (!(await vault.isBiometricAvailable())) {
    return 'unavailable';
  }
  return (await vault.hasBiometric()) ? 'ready' : 'not_enrolled';
};

/** Whether the OS-prompt unlock path is available and set up on this device. */
export const canUnlockWithBiometric = async () =>
  (await getBiometricUnlockState()) === 'ready';

export const isInvalidPassword = error =>
  error?.code === VAULT_ERROR_CODES.INVALID_PASSWORD;
