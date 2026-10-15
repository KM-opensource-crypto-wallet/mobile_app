// "Restore wallets from this device": the state store is gone or empty (a
// reinstall, a store that came back unreadable) but the vault still holds the
// wallets' keys. The old password opens it and the wallets are rebuilt from
// those keys, so losing the state store never loses a wallet.
//
// The vault is never written until every wallet is back: the keys are read,
// the vault is locked again (vaultSync skips writes while locked), the wallets
// are recreated, and only when each recovered key is found in the new wallets
// is the vault rewritten and the account marked as existing. Any failure
// removes the rebuilt wallets and leaves the old vault exactly as it was, so
// the restore can be retried.
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {VAULT_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';
import * as secureStore from 'security/secureStore';
import {
  createClientIdIfNotExist,
  createIfNotExistsMasterClientId,
  createWallet,
  reassignCurrentWalletIfHidden,
  resetCoinsToDefaultAddressForPrivacyMode,
  resetWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  signUpSuccess,
  vaultUnlocked,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {getHasAccount} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import {extractVaultPayload} from 'dok-wallet-blockchain-networks/redux/wallets/walletSecrets';
import {addBreadcrumb, captureError, logger} from 'services/logger';
import {persistor, vaultSync} from 'redux/store';
import {AccountExistsError} from './unlockFlow';
import {setRestoringFromVault} from './restoreState';

export const RESTORE_ERROR_CODES = Object.freeze({
  NOTHING_TO_RESTORE: 'restore_nothing',
  FAILED: 'restore_failed',
  TOO_MANY_ATTEMPTS: 'restore_too_many_attempts',
});

// Wrong passwords on the restore screen. Kept in the secure store next to the
// vault, so deleting and reinstalling the app does not reset it (a reinstall
// is how this screen is reached). Never destroys the vault: that is the loss
// this screen exists to prevent; guessing is slowed down instead.
export const RESTORE_ATTEMPT_KEYS = Object.freeze({
  failures: 'restore.failures',
  lockedUntil: 'restore.lockedUntil',
});
export const RESTORE_FREE_ATTEMPTS = 5;
const RESTORE_BASE_DELAY_MS = 30 * 1000;
const RESTORE_MAX_DELAY_MS = 60 * 60 * 1000;

/** Wait after `failures` wrong passwords: none for the first five, then 30 s doubling to 1 h. */
export const restoreDelayMs = failures =>
  failures < RESTORE_FREE_ATTEMPTS
    ? 0
    : Math.min(
        RESTORE_BASE_DELAY_MS * 2 ** (failures - RESTORE_FREE_ATTEMPTS),
        RESTORE_MAX_DELAY_MS,
      );

export class TooManyAttemptsError extends Error {
  constructor(retryInMs) {
    const minutes = Math.max(1, Math.ceil(retryInMs / 60000));
    super(
      `Too many wrong passwords. Try again in ${minutes} minute${
        minutes === 1 ? '' : 's'
      }.`,
    );
    this.name = 'TooManyAttemptsError';
    this.code = RESTORE_ERROR_CODES.TOO_MANY_ATTEMPTS;
    this.retryInMs = retryInMs;
  }
}

const readNumber = async key => Number((await secureStore.get(key)) || 0) || 0;

const assertNotLockedOut = async now => {
  const lockedUntil = await readNumber(RESTORE_ATTEMPT_KEYS.lockedUntil);
  if (lockedUntil > now) {
    throw new TooManyAttemptsError(lockedUntil - now);
  }
};

const recordWrongPassword = async now => {
  const failures = (await readNumber(RESTORE_ATTEMPT_KEYS.failures)) + 1;
  await secureStore.set(RESTORE_ATTEMPT_KEYS.failures, String(failures));
  const delay = restoreDelayMs(failures);
  if (delay) {
    await secureStore.set(
      RESTORE_ATTEMPT_KEYS.lockedUntil,
      String(now + delay),
    );
  }
  logger.warn('vault.restore_wrong_password', {failures});
};

const clearAttempts = async () => {
  await secureStore.remove(RESTORE_ATTEMPT_KEYS.failures);
  await secureStore.remove(RESTORE_ATTEMPT_KEYS.lockedUntil);
};

export class NothingToRestoreError extends Error {
  constructor() {
    super('No wallets were found in the saved keys on this device.');
    this.name = 'NothingToRestoreError';
    this.code = RESTORE_ERROR_CODES.NOTHING_TO_RESTORE;
  }
}

export class RestoreFailedError extends Error {
  constructor(cause) {
    super(
      'Your wallets could not be restored. Nothing was changed; check your internet connection and try again.',
    );
    this.name = 'RestoreFailedError';
    this.code = RESTORE_ERROR_CODES.FAILED;
    this.cause = cause;
  }
}

/** Whether onboarding should offer the restore: keys saved, no account. */
export const canRestoreFromVault = () => async (dispatch, getState) =>
  !getHasAccount(getState()) && vault.hasVault();

// The chain of a private-key wallet: the chain_existing entry or coin whose
// key is the wallet's own (coin keys are `<chain_name>_<SYMBOL>`).
const chainOfPrivateKey = entry => {
  for (const [chain, value] of Object.entries(entry.chainExisting || {})) {
    if (value?.privateKey === entry.privateKey) {
      return chain;
    }
  }
  for (const [coinKey, value] of Object.entries(entry.coins || {})) {
    if (value?.privateKey === entry.privateKey) {
      return coinKey.slice(0, coinKey.lastIndexOf('_'));
    }
  }
  return null;
};

/**
 * One import per vault wallet, in the original order: `{phrase}` for a
 * recovery-phrase wallet, `{privateKey, chain_name}` for a private-key one.
 * Entries with neither (nothing to sign with) are counted as skipped.
 */
export const buildRestorePlan = payload => {
  const plan = [];
  let skipped = 0;
  for (const entry of Object.values(payload?.wallets || {})) {
    if (entry?.phrase) {
      plan.push({phrase: entry.phrase});
      continue;
    }
    const chain_name = entry?.privateKey ? chainOfPrivateKey(entry) : null;
    if (chain_name) {
      plan.push({privateKey: entry.privateKey, chain_name});
    } else {
      skipped += 1;
    }
  }
  return {plan, skipped};
};

// Every recovered phrase / private key must be in the rebuilt wallets before
// the vault is rewritten with them.
const findMissingAfterRestore = (plan, payload) => {
  const entries = Object.values(payload?.wallets || {});
  return plan.filter(item =>
    item.phrase
      ? !entries.some(entry => entry?.phrase === item.phrase)
      : !entries.some(entry => entry?.privateKey === item.privateKey),
  ).length;
};

// Only ever called with the vault locked: vaultSync's reset write is then a
// no-op and the old vault is untouched. resetWallet also drops the install's
// client ids, which main.js normally creates at store load.
const clearWallets = async dispatch => {
  dispatch(resetWallet());
  dispatch(createClientIdIfNotExist());
  await dispatch(createIfNotExistsMasterClientId());
};

export const restoreFromVault = password => async (dispatch, getState) => {
  if (getHasAccount(getState())) {
    throw new AccountExistsError();
  }
  const now = Date.now();
  await assertNotLockedOut(now);
  // Throws INVALID_PASSWORD for a wrong password; nothing else changes.
  let payload;
  try {
    payload = await vault.unlockWithPassword(password);
  } catch (error) {
    if (error?.code === VAULT_ERROR_CODES.INVALID_PASSWORD) {
      await recordWrongPassword(now);
    }
    throw error;
  }
  await clearAttempts();
  vault.lock();
  const {plan, skipped} = buildRestorePlan(payload);
  if (!plan.length) {
    throw new NothingToRestoreError();
  }

  setRestoringFromVault(true);
  let saving = false;
  try {
    // Wallets persisted without keys (a restore killed half way) are rebuilt.
    if (getState().wallets?.allWallets?.length) {
      await clearWallets(dispatch);
    }
    for (const [index, item] of plan.entries()) {
      await dispatch(
        createWallet({walletName: `Restored wallet ${index + 1}`, ...item}),
      ).unwrap();
    }
    const rebuilt = extractVaultPayload(getState().wallets?.allWallets);
    if (findMissingAfterRestore(plan, rebuilt)) {
      throw new Error('A restored wallet is missing its key');
    }
    // Drop any debounced snapshot first: once the vault is open again only
    // the verified, complete payload may be written.
    vaultSync.reset();
    await vault.unlockWithPassword(password);
    saving = true;
    await vault.saveSecrets(rebuilt);
    vaultSync.markSynced(rebuilt);
  } catch (error) {
    if (saving && vault.isUnlocked()) {
      // The rewrite failed part way: put the keys that were read back, so the
      // vault never ends up holding less than before the restore.
      await vault.saveSecrets(payload).catch(writeError =>
        captureError(writeError, {
          tags: {area: 'vault', op: 'restore_rollback'},
        }),
      );
    }
    vault.lock();
    await clearWallets(dispatch).catch(() => {});
    setRestoringFromVault(false);
    captureError(error, {tags: {area: 'vault', op: 'restore_from_vault'}});
    throw new RestoreFailedError(error);
  }
  setRestoringFromVault(false);

  dispatch(signUpSuccess());
  dispatch(resetCoinsToDefaultAddressForPrivacyMode());
  dispatch(reassignCurrentWalletIfHidden());
  dispatch(vaultUnlocked());
  await persistor.flush();
  const counts = {wallets: plan.length, skipped};
  addBreadcrumb('auth', 'vault.restored', counts);
  logger.info('vault.restored', counts);
  return counts;
};
