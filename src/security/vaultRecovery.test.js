// "Restore wallets saved on this device": rebuild every wallet from the keys
// in a vault that outlived its state store, and never write the vault until
// all of them are back.
jest.mock('services/logger', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
  logger: {info: jest.fn(), warn: jest.fn(), error: jest.fn()},
}));
jest.mock('utils/wlData', () => ({WL_APP_NAME: 'Dok Wallet'}));
jest.mock('redux/store', () => ({
  persistor: {flush: jest.fn(async () => {})},
  vaultSync: {reset: jest.fn(), markSynced: jest.fn()},
}));
jest.mock('redux/storage/mmkvStorage', () => ({
  releaseBlockedWrites: jest.fn(async () => {}),
}));
jest.mock('redux/storage/bootstrap', () => ({
  confirmAccountStored: jest.fn(async () => {}),
}));
jest.mock('security/unlockFlow', () => ({
  AccountExistsError: class AccountExistsError extends Error {
    code = 'account_exists';
  },
}));
const mockSecure = new Map();
jest.mock('security/secureStore', () => ({
  get: jest.fn(async key => mockSecure.get(key) ?? null),
  set: jest.fn(async (key, value) => {
    mockSecure.set(key, value);
  }),
  remove: jest.fn(async key => {
    mockSecure.delete(key);
  }),
}));
jest.mock('dok-wallet-blockchain-networks/security/vault', () => ({
  hasVault: jest.fn(async () => true),
  unlockWithPassword: jest.fn(),
  lock: jest.fn(),
  isUnlocked: jest.fn(() => true),
  saveSecrets: jest.fn(async () => {}),
}));
jest.mock('dok-wallet-blockchain-networks/redux/wallets/walletsSlice', () => ({
  createWallet: data => ({type: 'wallets/createWallet', data}),
  resetWallet: () => ({type: 'wallets/resetWallet'}),
  createClientIdIfNotExist: () => ({type: 'wallets/createClientIdIfNotExist'}),
  createIfNotExistsMasterClientId: () => ({
    type: 'wallets/createIfNotExistsMasterClientId',
  }),
  reassignCurrentWalletIfHidden: () => ({
    type: 'wallets/reassignCurrentWalletIfHidden',
  }),
  resetCoinsToDefaultAddressForPrivacyMode: () => ({
    type: 'wallets/resetCoinsToDefaultAddressForPrivacyMode',
  }),
}));
jest.mock('dok-wallet-blockchain-networks/redux/auth/authSlice', () => ({
  signUpSuccess: () => ({type: 'auth/signUpSuccess'}),
  vaultUnlocked: () => ({type: 'auth/vaultUnlocked'}),
}));
jest.mock('dok-wallet-blockchain-networks/redux/wallets/walletSecrets', () => ({
  extractVaultPayload: allWallets => ({
    v: 1,
    wallets: Object.fromEntries(
      allWallets.map(w => [
        w.clientId,
        w.phrase ? {phrase: w.phrase} : {privateKey: w.privateKey},
      ]),
    ),
  }),
}));

import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {persistor, vaultSync} from 'redux/store';
import {confirmAccountStored} from 'redux/storage/bootstrap';
import {
  RESTORE_ATTEMPT_KEYS,
  RESTORE_ERROR_CODES,
  RESTORE_FREE_ATTEMPTS,
  buildRestorePlan,
  restoreDelayMs,
  restoreFromVault,
} from 'security/vaultRecovery';
import {isRestoringFromVault} from 'security/restoreState';

const OLD = {
  v: 1,
  wallets: {
    a: {phrase: 'alpha words', coins: {}},
    b: {
      privateKey: 'pk-b',
      coins: {ethereum_ETH: {privateKey: 'pk-b'}},
      chainExisting: {},
    },
    c: {coins: {}},
  },
};

// A tiny store: createWallet adds a wallet with the requested key unless
// `failOn` matches; resetWallet empties the list.
const makeStore = ({failOn} = {}) => {
  const state = {auth: {hasAccount: false}, wallets: {allWallets: []}};
  const actions = [];
  const dispatch = action => {
    if (typeof action === 'function') {
      return action(dispatch, () => state);
    }
    actions.push(action.type);
    if (action.type === 'wallets/resetWallet') {
      state.wallets.allWallets = [];
    }
    if (action.type === 'auth/signUpSuccess') {
      state.auth.hasAccount = true;
    }
    if (action.type === 'wallets/createWallet') {
      const {phrase, privateKey} = action.data;
      if (failOn && (phrase === failOn || privateKey === failOn)) {
        return {unwrap: () => Promise.reject(new Error('network'))};
      }
      state.wallets.allWallets.push({
        clientId: `new-${state.wallets.allWallets.length}`,
        phrase,
        privateKey,
      });
      return {unwrap: () => Promise.resolve({})};
    }
    return action;
  };
  return {state, actions, dispatch};
};

describe('buildRestorePlan', () => {
  it('maps phrase and private-key wallets, skipping entries without keys', () => {
    expect(buildRestorePlan(OLD)).toEqual({
      plan: [
        {phrase: 'alpha words'},
        {privateKey: 'pk-b', chain_name: 'ethereum'},
      ],
      skipped: 1,
    });
  });

  it('prefers the chain_existing entry for a private-key wallet', () => {
    const {plan} = buildRestorePlan({
      wallets: {
        x: {
          privateKey: 'k',
          chainExisting: {binance_smart_chain: {privateKey: 'k'}},
          coins: {},
        },
      },
    });
    expect(plan).toEqual([
      {privateKey: 'k', chain_name: 'binance_smart_chain'},
    ]);
  });
});

describe('restoreFromVault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecure.clear();
    vault.unlockWithPassword.mockResolvedValue(OLD);
    vault.isUnlocked.mockReturnValue(true);
  });

  it('rebuilds every wallet with the vault locked, then writes them once', async () => {
    const store = makeStore();
    const result = await store.dispatch(restoreFromVault('old-pw'));

    expect(result).toEqual({wallets: 2, skipped: 1});
    expect(
      store.state.wallets.allWallets.map(w => w.phrase || w.privateKey),
    ).toEqual(['alpha words', 'pk-b']);
    // Read, locked for the rebuild, opened again only to write.
    expect(vault.unlockWithPassword).toHaveBeenCalledTimes(2);
    expect(vault.lock).toHaveBeenCalledTimes(1);
    expect(vault.saveSecrets).toHaveBeenCalledTimes(1);
    expect(vaultSync.reset).toHaveBeenCalled();
    expect(store.actions).toContain('auth/signUpSuccess');
    expect(store.actions).toContain('auth/vaultUnlocked');
    expect(isRestoringFromVault()).toBe(false);
  });

  it('releases the blocked auth and wallets keys only once the restore succeeded', async () => {
    const {releaseBlockedWrites} = require('redux/storage/mmkvStorage');
    const store = makeStore();
    await store.dispatch(restoreFromVault('old-pw'));
    expect(releaseBlockedWrites.mock.calls.map(([key]) => key)).toEqual([
      'persist:auth',
      'persist:wallets',
    ]);
    // Released before the account flag is set, so that write is not refused.
    expect(releaseBlockedWrites.mock.invocationCallOrder[1]).toBeLessThan(
      Math.max(...persistor.flush.mock.invocationCallOrder),
    );
  });

  it('clears the reinstall marker once the account write is flushed', async () => {
    const store = makeStore();
    await store.dispatch(restoreFromVault('old-pw'));
    expect(confirmAccountStored).toHaveBeenCalledTimes(1);
    expect(confirmAccountStored.mock.invocationCallOrder[0]).toBeGreaterThan(
      Math.max(...persistor.flush.mock.invocationCallOrder),
    );
  });

  it('a failure to clear the marker does not fail a restore that succeeded', async () => {
    const {captureError} = require('services/logger');
    confirmAccountStored.mockRejectedValueOnce(new Error('mmkv'));
    const store = makeStore();
    await expect(store.dispatch(restoreFromVault('old-pw'))).resolves.toEqual({
      wallets: 2,
      skipped: 1,
    });
    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({message: 'mmkv'}),
      expect.objectContaining({
        tags: expect.objectContaining({op: 'reinstall_marker'}),
      }),
    );
  });

  it('a wrong password changes nothing', async () => {
    vault.unlockWithPassword.mockRejectedValueOnce(
      Object.assign(new Error('bad'), {code: 'invalid_password'}),
    );
    const store = makeStore();
    await expect(
      store.dispatch(restoreFromVault('nope')),
    ).rejects.toMatchObject({code: 'invalid_password'});
    expect(store.actions).toEqual([]);
    expect(vault.saveSecrets).not.toHaveBeenCalled();
  });

  it('one failed wallet undoes the restore and never writes the vault', async () => {
    const store = makeStore({failOn: 'pk-b'});
    await expect(
      store.dispatch(restoreFromVault('old-pw')),
    ).rejects.toMatchObject({code: RESTORE_ERROR_CODES.FAILED});
    expect(vault.saveSecrets).not.toHaveBeenCalled();
    expect(
      require('redux/storage/mmkvStorage').releaseBlockedWrites,
    ).not.toHaveBeenCalled();
    expect(store.state.wallets.allWallets).toEqual([]);
    expect(store.state.auth.hasAccount).toBe(false);
    expect(isRestoringFromVault()).toBe(false);
    expect(confirmAccountStored).not.toHaveBeenCalled();
  });

  it('a cleanup failure still clears the restore flag and keeps the restore error', async () => {
    const store = makeStore({failOn: 'pk-b'});
    vault.lock
      .mockImplementationOnce(() => {}) // after the first read
      .mockImplementationOnce(() => {
        throw new Error('lock failed');
      });
    await expect(
      store.dispatch(restoreFromVault('old-pw')),
    ).rejects.toMatchObject({code: RESTORE_ERROR_CODES.FAILED});
    expect(isRestoringFromVault()).toBe(false);
    // The rebuilt wallets are still removed.
    expect(store.state.wallets.allWallets).toEqual([]);
  });

  it('a failed vault rewrite puts the old keys back', async () => {
    vault.saveSecrets
      .mockRejectedValueOnce(new Error('keychain'))
      .mockResolvedValueOnce();
    const store = makeStore();
    await expect(
      store.dispatch(restoreFromVault('old-pw')),
    ).rejects.toMatchObject({code: RESTORE_ERROR_CODES.FAILED});
    expect(vault.saveSecrets).toHaveBeenLastCalledWith(OLD);
    expect(store.state.auth.hasAccount).toBe(false);
  });

  it('a vault with no usable keys reports nothing to restore', async () => {
    vault.unlockWithPassword.mockResolvedValue({v: 1, wallets: {c: {}}});
    const store = makeStore();
    await expect(
      store.dispatch(restoreFromVault('old-pw')),
    ).rejects.toMatchObject({code: RESTORE_ERROR_CODES.NOTHING_TO_RESTORE});
    expect(vault.lock).toHaveBeenCalled();
  });
});

// Reaching this screen only takes a reinstall, so wrong passwords are slowed
// down with a counter kept in the Keychain (it survives the reinstall). The
// vault itself is never destroyed for it.
describe('restore password attempts', () => {
  const wrong = () =>
    vault.unlockWithPassword.mockRejectedValueOnce(
      Object.assign(new Error('bad'), {code: 'invalid_password'}),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockSecure.clear();
    vault.unlockWithPassword.mockResolvedValue(OLD);
  });

  it('waits 30 s after the fifth wrong password, doubling up to an hour', () => {
    expect(restoreDelayMs(RESTORE_FREE_ATTEMPTS - 1)).toBe(0);
    expect(restoreDelayMs(RESTORE_FREE_ATTEMPTS)).toBe(30000);
    expect(restoreDelayMs(RESTORE_FREE_ATTEMPTS + 1)).toBe(60000);
    expect(restoreDelayMs(50)).toBe(60 * 60 * 1000);
  });

  it('locks out after five wrong passwords without trying the vault', async () => {
    const store = makeStore();
    for (let i = 0; i < RESTORE_FREE_ATTEMPTS; i++) {
      wrong();
      await expect(store.dispatch(restoreFromVault('x'))).rejects.toMatchObject(
        {code: 'invalid_password'},
      );
    }
    vault.unlockWithPassword.mockClear();
    await expect(
      store.dispatch(restoreFromVault('old-pw')),
    ).rejects.toMatchObject({code: RESTORE_ERROR_CODES.TOO_MANY_ATTEMPTS});
    expect(vault.unlockWithPassword).not.toHaveBeenCalled();
    expect(mockSecure.get(RESTORE_ATTEMPT_KEYS.failures)).toBe('5');
  });

  it('a right password clears the counter', async () => {
    wrong();
    const store = makeStore();
    await expect(store.dispatch(restoreFromVault('x'))).rejects.toBeTruthy();
    await store.dispatch(restoreFromVault('old-pw'));
    expect(mockSecure.has(RESTORE_ATTEMPT_KEYS.failures)).toBe(false);
  });
});
