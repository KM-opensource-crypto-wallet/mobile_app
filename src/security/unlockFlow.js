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
  hydrateWalletSecrets,
  reassignCurrentWalletIfHidden,
  resetCoinsToDefaultAddressForPrivacyMode,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {vaultUnlocked} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {isFingerprint} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {addBreadcrumb, captureError} from 'services/logger';
import {bootstrapStorage} from 'redux/storage/bootstrap';
import {finalizeLegacyMigration} from 'redux/storage/migrateLegacyRoot2';
import {vaultSync} from 'redux/store';
import {BIOMETRIC_PROMPT} from './biometricPrompt';

export const UNLOCK_ERROR_CODES = Object.freeze({
  ...VAULT_ERROR_CODES,
  MISSING_SECRETS: 'missing_secrets',
});

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

const completeUnlock = async (dispatch, getState, payload, via) => {
  dispatch(hydrateWalletSecrets(payload));
  const missing = findWalletsWithoutKeys(getState().wallets?.allWallets);
  if (missing.length) {
    captureError(new Error('Wallets without secrets after unlock'), {
      tags: {area: 'vault', op: 'missing_secrets'},
      extra: {count: missing.length, via},
    });
    throw new MissingSecretsError(missing);
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
