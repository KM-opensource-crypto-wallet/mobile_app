// createAccount's orphan path: legacy wallets migrated without a password
// have their keys parked in memory. They are released only once the vault
// write AND the schemaVersion commit succeeded; any failure keeps them parked
// for the next Registration submit and closes the half-open session.
jest.mock('services/logger', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));
jest.mock('utils/wlData', () => ({WL_APP_NAME: 'Dok Wallet'}));
jest.mock('redux/store', () => ({
  vaultSync: {
    reset: jest.fn(),
    flush: jest.fn(async () => true),
    markSynced: jest.fn(),
  },
}));
const mockMmkv = {id: 'mmkv'};
jest.mock('redux/storage/bootstrap', () => ({
  bootstrapStorage: jest.fn(async () => mockMmkv),
}));
jest.mock('redux/storage/migrateLegacyRoot2', () => ({
  peekOrphanVaultPayload: jest.fn(() => null),
  consumeOrphanVaultPayload: jest.fn(() => null),
  commitOrphanLegacyMigration: jest.fn(() => true),
  finalizeLegacyMigration: jest.fn(async () => true),
}));
jest.mock('dok-wallet-blockchain-networks/security/vault', () => ({
  hasVault: jest.fn(async () => false),
  destroy: jest.fn(async () => {}),
  createVault: jest.fn(async () => {}),
  lock: jest.fn(),
  isBiometricAvailable: jest.fn(async () => false),
  hasBiometric: jest.fn(async () => false),
}));
jest.mock('dok-wallet-blockchain-networks/redux/wallets/walletsSlice', () => ({
  clearWalletSecrets: () => ({type: 'wallets/clearWalletSecrets'}),
  hydrateWalletSecrets: payload => ({
    type: 'wallets/hydrateWalletSecrets',
    payload,
  }),
  reassignCurrentWalletIfHidden: () => ({
    type: 'wallets/reassignCurrentWalletIfHidden',
  }),
  resetCoinsToDefaultAddressForPrivacyMode: () => ({
    type: 'wallets/resetCoinsToDefaultAddressForPrivacyMode',
  }),
}));
jest.mock('dok-wallet-blockchain-networks/redux/auth/authSlice', () => ({
  vaultLocked: () => ({type: 'auth/vaultLocked'}),
  vaultUnlocked: () => ({type: 'auth/vaultUnlocked'}),
}));
jest.mock(
  'dok-wallet-blockchain-networks/redux/settings/settingsSelectors',
  () => ({isFingerprint: () => false}),
);

import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {vaultSync} from 'redux/store';
import {
  commitOrphanLegacyMigration,
  consumeOrphanVaultPayload,
  peekOrphanVaultPayload,
} from 'redux/storage/migrateLegacyRoot2';
import {UNLOCK_ERROR_CODES, createAccount} from 'security/unlockFlow';

const ORPHAN = {v: 1, wallets: {w1: {phrase: 'm'}}};

const run = () => {
  const dispatched = [];
  const dispatch = action => {
    dispatched.push(action);
    return action;
  };
  const getState = () => ({
    auth: {hasAccount: false},
    wallets: {allWallets: []},
    settings: {},
  });
  return {dispatched, result: createAccount('pw')(dispatch, getState)};
};
const types = dispatched => dispatched.map(a => a.type);

describe('createAccount (orphan legacy keys)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    peekOrphanVaultPayload.mockReturnValue(ORPHAN);
    vaultSync.flush.mockResolvedValue(true);
    commitOrphanLegacyMigration.mockImplementation(() => true);
  });

  it('without parked keys neither flushes nor commits', async () => {
    peekOrphanVaultPayload.mockReturnValue(null);
    const {dispatched, result} = run();
    await result;
    expect(vaultSync.flush).not.toHaveBeenCalled();
    expect(commitOrphanLegacyMigration).not.toHaveBeenCalled();
    expect(consumeOrphanVaultPayload).not.toHaveBeenCalled();
    expect(types(dispatched)).toContain('auth/vaultUnlocked');
    expect(types(dispatched)).not.toContain('wallets/hydrateWalletSecrets');
  });

  it('hydrates, writes, commits, then releases the parked keys', async () => {
    const {dispatched, result} = run();
    await result;
    expect(vaultSync.reset).toHaveBeenCalledTimes(1);
    expect(dispatched).toContainEqual({
      type: 'wallets/hydrateWalletSecrets',
      payload: ORPHAN,
    });
    expect(commitOrphanLegacyMigration).toHaveBeenCalledWith(mockMmkv);
    // Released only after the commit.
    expect(consumeOrphanVaultPayload).toHaveBeenCalledTimes(1);
    expect(
      consumeOrphanVaultPayload.mock.invocationCallOrder[0],
    ).toBeGreaterThan(commitOrphanLegacyMigration.mock.invocationCallOrder[0]);
    expect(vault.lock).not.toHaveBeenCalled();
    expect(types(dispatched)).not.toContain('auth/vaultLocked');
  });

  it('a vault write that did not land refuses, rolls back and keeps the keys parked', async () => {
    vaultSync.flush.mockResolvedValue(false);
    const {dispatched, result} = run();
    await expect(result).rejects.toMatchObject({
      code: UNLOCK_ERROR_CODES.VAULT_WRITE_FAILED,
    });
    expect(commitOrphanLegacyMigration).not.toHaveBeenCalled();
    expect(consumeOrphanVaultPayload).not.toHaveBeenCalled();
    // Dirty snapshot dropped, session closed like a failed unlock.
    expect(vaultSync.reset).toHaveBeenCalledTimes(2);
    expect(vault.lock).toHaveBeenCalledTimes(1);
    const seen = types(dispatched);
    expect(seen.indexOf('auth/vaultLocked')).toBeGreaterThan(
      seen.indexOf('auth/vaultUnlocked'),
    );
    expect(seen).toContain('wallets/clearWalletSecrets');
  });

  it('a failed commit rolls back and keeps the keys parked', async () => {
    const boom = new Error('mmkv unavailable');
    commitOrphanLegacyMigration.mockImplementation(() => {
      throw boom;
    });
    const {dispatched, result} = run();
    await expect(result).rejects.toBe(boom);
    expect(consumeOrphanVaultPayload).not.toHaveBeenCalled();
    expect(vault.lock).toHaveBeenCalledTimes(1);
    expect(types(dispatched)).toContain('auth/vaultLocked');
  });
});
