import * as rnsi from 'react-native-sensitive-info';
import * as mmkvModule from 'react-native-mmkv';
import {Platform} from 'react-native';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {
  extractVaultPayload,
  assertNoSecrets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletSecrets';
import {parsePersistEnvelope} from 'dok-wallet-blockchain-networks/redux/storage/legacyRootMigration';
import {
  SCHEMA_VERSION,
  STORAGE_KEYS,
  bootstrapStorage,
  getStateStore,
  resetBootstrap,
  setBootstrapContext,
} from 'redux/storage/bootstrap';
import {
  MIGRATION_ERROR_CODES,
  consumeOrphanVaultPayload,
  finalizeLegacyMigration,
  migrateLegacyRoot2,
} from 'redux/storage/migrateLegacyRoot2';
import {
  LEGACY_KEYCHAIN_SERVICE,
  LEGACY_ROOT_KEY,
  LEGACY_SHARED_PREFERENCES,
} from 'redux/storage/wipe';
import * as secureStore from 'security/secureStore';
import {
  SECURE_STORE_ERROR_CODES,
  SecureStoreError,
} from 'dok-wallet-blockchain-networks/security/errors';
import {
  clearLegacySecureStorage,
  getLegacySecureValue,
} from 'myWallet/wallet.service';

jest.mock('services/logger', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('utils/wlData', () => ({
  WL_APP_NAME: 'Dok Wallet',
  IS_KIML_WALLET: false,
  wlName: 'dokwallet',
  WALLET_CONNECT_DATA: {},
}));
jest.mock('myWallet/wallet.service', () => ({
  getLegacySecureValue: jest.fn(async () => null),
  clearLegacySecureStorage: jest.fn(async () => {}),
}));
jest.mock('utils/asyncStorage', () => ({
  getAsyncStorageData: jest.fn(async () => 'true'),
  storeAsyncStorageData: jest.fn(async () => {}),
}));
jest.mock('dok-wallet-blockchain-networks/security/vaultCore', () => {
  const actual = jest.requireActual(
    'dok-wallet-blockchain-networks/security/vaultCore',
  );
  return {
    ...actual,
    wrapDek: (dek, password, options = {}) =>
      actual.wrapDek(dek, password, {iterations: 1000, ...options}),
  };
});

const HEX = i => `0x${String(i).padStart(2, '0').repeat(32)}`;
const MNEMONIC = 'abandon '.repeat(11) + 'about';

const legacySlices = ({password = 'Secret123!', fingerprint = false} = {}) => ({
  auth: {
    isLogin: true,
    password,
    loading: false,
    error: null,
    attempts: [],
    maxAttempt: 5,
  },
  wallets: {
    allWallets: [
      {
        clientId: 'w1',
        walletName: 'Main',
        phrase: MNEMONIC,
        coins: [
          {
            _id: 'c1',
            chain_name: 'ethereum',
            symbol: 'ETH',
            address: '0xa0',
            privateKey: HEX(1),
            deriveAddresses: [
              {
                address: '0xa0',
                derivePath: "m/44'/60'/0'/0/0",
                privateKey: HEX(1),
              },
            ],
            transactions: [{hash: 'ab'.repeat(32)}],
          },
        ],
        chain_existing_coin: {ethereum: {address: '0xa0', privateKey: HEX(1)}},
      },
      {clientId: 'w2', walletName: 'PK', privateKey: HEX(9), coins: []},
    ],
    currentWalletIndex: 1,
    masterClientId: 'master',
    isRefreshingAllWallets: true,
  },
  settings: {theme: 'dark', fingerprint},
  schedulePayment: {
    scheduledPayments: [],
    isSubmitting: true,
    pendingSubmitCount: 1,
  },
  customRpc: {},
});

const legacyRoot = slices =>
  JSON.stringify({
    ...Object.fromEntries(
      Object.entries(slices).map(([k, v]) => [k, JSON.stringify(v)]),
    ),
    _persist: JSON.stringify({version: -1, rehydrated: true}),
  });

const seedLegacy = async slices => {
  await rnsi.setItem(LEGACY_ROOT_KEY, legacyRoot(slices), {
    service: LEGACY_KEYCHAIN_SERVICE,
    accessControl: 'none',
  });
};

const legacyStillThere = async () =>
  (await rnsi.getItem(LEGACY_ROOT_KEY, {
    service: LEGACY_KEYCHAIN_SERVICE,
  })) != null;

describe('migrateLegacyRoot2', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    resetBootstrap();
    setBootstrapContext('foreground');
    vault.__resetForTests();
    rnsi.__mock.reset();
    mmkvModule.__mock.reset();
    consumeOrphanVaultPayload();
  });

  it('migrates every slice, builds the vault, keeps the legacy blob and sets schemaVersion 2', async () => {
    const slices = legacySlices();
    await seedLegacy(slices);

    const mmkv = await bootstrapStorage();

    expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
      SCHEMA_VERSION.migrated,
    );
    expect(mmkv.getNumber(STORAGE_KEYS.migratedAt)).toEqual(expect.any(Number));
    expect(await legacyStillThere()).toBe(true);

    for (const name of Object.keys(slices)) {
      expect(mmkv.contains(`persist:${name}`)).toBe(true);
    }
    const auth = parsePersistEnvelope(mmkv.getString('persist:auth'));
    expect(auth.hasAccount).toBe(true);
    expect(auth.password).toBeUndefined();
    expect(auth._persist).toEqual({version: 1, rehydrated: true});

    const wallets = parsePersistEnvelope(mmkv.getString('persist:wallets'));
    expect(wallets.currentWalletClientId).toBe('w2');
    expect(wallets.isRefreshingAllWallets).toBe(false);
    expect(wallets.allWallets[0].coins[0].transactions).toHaveLength(1);
    expect(() => assertNoSecrets(wallets)).not.toThrow();

    const schedule = parsePersistEnvelope(
      mmkv.getString('persist:schedulePayment'),
    );
    expect(schedule.isSubmitting).toBe(false);

    // The vault is locked after migration and opens with the legacy password.
    expect(vault.isUnlocked()).toBe(false);
    const payload = await vault.unlockWithPassword('Secret123!');
    expect(payload).toEqual(extractVaultPayload(slices.wallets.allWallets));
    await expect(vault.unlockWithPassword('wrong')).rejects.toMatchObject({
      code: 'invalid_password',
    });
    // iOS + fingerprint off: no biometric item.
    expect(await vault.hasBiometric()).toBe(false);
  });

  it('is idempotent: a second run over the same legacy blob gives the same stores', async () => {
    const slices = legacySlices();
    await seedLegacy(slices);
    const first = await bootstrapStorage();
    const snapshot = Object.fromEntries(
      first
        .getAllKeys()
        .filter(k => k.startsWith('persist:'))
        .map(k => [k, first.getString(k)]),
    );
    // Simulate a kill before schemaVersion was written: wipe the marker only.
    first.remove(STORAGE_KEYS.schemaVersion);
    resetBootstrap();
    const second = await bootstrapStorage();
    expect(second.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
      SCHEMA_VERSION.migrated,
    );
    for (const [k, v] of Object.entries(snapshot)) {
      expect(second.getString(k)).toBe(v);
    }
    expect(await vault.unlockWithPassword('Secret123!')).toEqual(
      extractVaultPayload(slices.wallets.allWallets),
    );
  });

  it('assigns a clientId to pre-clientId wallets and keeps their secrets reachable', async () => {
    // Wallets from before clientId existed only got one at runtime via
    // createClientIdIfNotExist; the migration must not strip them into limbo.
    const slices = legacySlices();
    slices.wallets.allWallets.push({
      walletName: 'Ancient',
      phrase: MNEMONIC,
      coins: [],
    });
    slices.wallets.currentWalletIndex = 2;
    await seedLegacy(slices);

    const mmkv = await bootstrapStorage();
    expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
      SCHEMA_VERSION.migrated,
    );

    const wallets = parsePersistEnvelope(mmkv.getString('persist:wallets'));
    const ancient = wallets.allWallets[2];
    expect(ancient.walletName).toBe('Ancient');
    expect(ancient.clientId).toEqual(expect.any(String));
    expect(ancient.phrase).toBeUndefined();
    expect(wallets.currentWalletClientId).toBe(ancient.clientId);

    const payload = await vault.unlockWithPassword('Secret123!');
    expect(payload.wallets[ancient.clientId].phrase).toBe(MNEMONIC);
    expect(Object.keys(payload.wallets).sort()).toEqual(
      ['w1', 'w2', ancient.clientId].sort(),
    );
  });

  it('redoes cleanly after a kill mid-migration (vault written, slices not)', async () => {
    const slices = legacySlices();
    await seedLegacy(slices);
    const saveSpy = jest
      .spyOn(vault, 'saveSecrets')
      .mockRejectedValueOnce(new Error('killed'));
    await expect(bootstrapStorage()).rejects.toThrow('killed');
    saveSpy.mockRestore();
    // Nothing committed: no marker, legacy intact, vault items may be partial.
    expect(await legacyStillThere()).toBe(true);

    resetBootstrap();
    const mmkv = await bootstrapStorage();
    expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
      SCHEMA_VERSION.migrated,
    );
    expect(await vault.unlockWithPassword('Secret123!')).toEqual(
      extractVaultPayload(slices.wallets.allWallets),
    );
  });

  it('headless context writes the plain slices only and leaves the state machine at 0', async () => {
    await seedLegacy(legacySlices());
    setBootstrapContext('headless');
    const mmkv = await bootstrapStorage();
    expect(mmkv.contains('persist:schedulePayment')).toBe(true);
    expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBeUndefined();
    expect(await vault.hasVault()).toBe(false);
    expect(await legacyStillThere()).toBe(true);

    // Same runtime comes to the foreground: the full migration runs.
    setBootstrapContext('foreground');
    const again = await bootstrapStorage();
    expect(again.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
      SCHEMA_VERSION.migrated,
    );
    expect(await vault.hasVault()).toBe(true);
  });

  it('empty password: plain slices, hasAccount=false, no vault, orphan secrets kept for the session', async () => {
    await seedLegacy(legacySlices({password: ''}));
    const mmkv = await bootstrapStorage();
    expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
      SCHEMA_VERSION.migrated,
    );
    expect(
      parsePersistEnvelope(mmkv.getString('persist:auth')).hasAccount,
    ).toBe(false);
    expect(await vault.hasVault()).toBe(false);
    const orphan = consumeOrphanVaultPayload();
    expect(Object.keys(orphan.wallets)).toEqual(['w1', 'w2']);
    expect(consumeOrphanVaultPayload()).toBeNull();
  });

  it('never enrols biometrics or shows an OS prompt during migration, on either platform', async () => {
    for (const os of ['ios', 'android']) {
      Platform.OS = os;
      resetBootstrap();
      vault.__resetForTests();
      rnsi.__mock.reset();
      mmkvModule.__mock.reset();
      await seedLegacy(legacySlices({fingerprint: true}));
      await bootstrapStorage();
      expect(await vault.hasBiometric()).toBe(false);
      // No biometric-protected read or write happened: no OS prompt at boot.
      expect(rnsi.__mock.state.prompts).toBe(0);
      expect(vault.isUnlocked()).toBe(false);
    }
  });

  it('corrupt legacy JSON is fatal: nothing written, promise stays rejected, legacy untouched', async () => {
    await rnsi.setItem(LEGACY_ROOT_KEY, '{not json', {
      service: LEGACY_KEYCHAIN_SERVICE,
      accessControl: 'none',
    });
    await expect(bootstrapStorage()).rejects.toMatchObject({
      code: MIGRATION_ERROR_CODES.PARSE,
    });
    const reads = rnsi.getItem.mock.calls.length;
    await expect(bootstrapStorage()).rejects.toMatchObject({
      code: MIGRATION_ERROR_CODES.PARSE,
    });
    // Memoised rejection: no second pass over the secure store.
    expect(rnsi.getItem.mock.calls.length).toBe(reads);
    expect(await legacyStillThere()).toBe(true);
    expect(await vault.hasVault()).toBe(false);
    expect(() => getStateStore()).toThrow();
  });

  it('fresh install with no legacy blob goes straight to schema 3', async () => {
    const mmkv = await bootstrapStorage();
    expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
      SCHEMA_VERSION.finalized,
    );
  });

  describe('legacy blob read failures are never mistaken for "no legacy blob"', () => {
    // Make only the legacy-key read fail; every other secure-store read
    // (reinstall check, MMKV key) keeps the mock's normal behaviour.
    const failLegacyReadWith = code => {
      const real = rnsi.getItem.getMockImplementation();
      rnsi.getItem.mockImplementation(async (key, options) => {
        if (key === LEGACY_ROOT_KEY) {
          throw Object.assign(new Error(code), {code});
        }
        return real(key, options);
      });
      return () => rnsi.getItem.mockImplementation(real);
    };

    it('secure store unavailable: bootstrap rejects (retryable), nothing is marked, legacy stays', async () => {
      const slices = legacySlices();
      await seedLegacy(slices);
      // RNSI 6 has no dedicated "keystore unavailable" code; the adapter
      // reports `unavailable` itself (e.g. a downgraded protected write, or
      // the web adapter without IndexedDB). Only that code clears the memo.
      const spy = jest
        .spyOn(secureStore, 'getFromService')
        .mockRejectedValueOnce(
          new SecureStoreError(SECURE_STORE_ERROR_CODES.UNAVAILABLE, 'locked'),
        );
      try {
        await expect(bootstrapStorage()).rejects.toMatchObject({
          code: 'unavailable',
        });
        expect(() => getStateStore()).toThrow();
      } finally {
        spy.mockRestore();
      }
      expect(await legacyStillThere()).toBe(true);

      // `unavailable` clears the memo: the next call runs the real migration.
      const mmkv = await bootstrapStorage();
      expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
        SCHEMA_VERSION.migrated,
      );
      expect(await vault.unlockWithPassword('Secret123!')).toEqual(
        extractVaultPayload(slices.wallets.allWallets),
      );
    });

    it('unknown error while the blob exists: rejects, never finalizes over it', async () => {
      await seedLegacy(legacySlices());
      const restore = failLegacyReadWith('E_SOMETHING_ELSE');
      try {
        await expect(bootstrapStorage()).rejects.toMatchObject({
          code: 'unknown',
        });
      } finally {
        restore();
      }
      expect(await legacyStillThere()).toBe(true);
      expect(() => getStateStore()).toThrow();
    });

    it('generic Android missing-key error with no blob really is a fresh install', async () => {
      const restore = failLegacyReadWith('E_SOMETHING_ELSE');
      try {
        const mmkv = await bootstrapStorage();
        expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
          SCHEMA_VERSION.finalized,
        );
      } finally {
        restore();
      }
    });
  });

  describe('pre-RNSI-5 Android SharedPreferences blob', () => {
    const seedPreferences = slices => {
      getLegacySecureValue.mockImplementation(async (prefs, key) =>
        prefs === LEGACY_SHARED_PREFERENCES && key === LEGACY_ROOT_KEY
          ? legacyRoot(slices)
          : null,
      );
    };

    afterEach(() => {
      getLegacySecureValue.mockReset();
      getLegacySecureValue.mockImplementation(async () => null);
      clearLegacySecureStorage.mockClear();
    });

    it('is read directly (never copied through the 1 MiB-capped secure store) and retained until finalisation', async () => {
      Platform.OS = 'android';
      const slices = legacySlices();
      seedPreferences(slices);

      const mmkv = await bootstrapStorage();

      expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
        SCHEMA_VERSION.migrated,
      );
      expect(getLegacySecureValue).toHaveBeenCalledWith(
        LEGACY_SHARED_PREFERENCES,
        LEGACY_ROOT_KEY,
      );
      // Not written into the secure store, not cleared yet.
      expect(await legacyStillThere()).toBe(false);
      expect(clearLegacySecureStorage).not.toHaveBeenCalled();
      expect(await vault.unlockWithPassword('Secret123!')).toEqual(
        extractVaultPayload(slices.wallets.allWallets),
      );

      const getState = () => ({
        wallets: {allWallets: slices.wallets.allWallets},
      });
      expect(await finalizeLegacyMigration({mmkv, getState})).toBe(true);
      expect(clearLegacySecureStorage).toHaveBeenCalledWith(
        LEGACY_SHARED_PREFERENCES,
      );
    });

    it('is not consulted on iOS', async () => {
      Platform.OS = 'ios';
      seedPreferences(legacySlices());
      const mmkv = await bootstrapStorage();
      expect(getLegacySecureValue).not.toHaveBeenCalled();
      expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
        SCHEMA_VERSION.finalized,
      );
    });

    it('a secure-store copy wins over the preferences copy', async () => {
      Platform.OS = 'android';
      const slices = legacySlices();
      await seedLegacy(slices);
      seedPreferences(legacySlices({fingerprint: true}));
      await bootstrapStorage();
      expect(getLegacySecureValue).not.toHaveBeenCalled();
    });
  });

  describe('finalizeLegacyMigration', () => {
    it('deletes the legacy blob and sets 3 once the hydrated wallets match', async () => {
      const slices = legacySlices();
      await seedLegacy(slices);
      const mmkv = await bootstrapStorage();
      const getState = () => ({
        wallets: {allWallets: slices.wallets.allWallets},
      });

      expect(await finalizeLegacyMigration({mmkv, getState})).toBe(true);
      expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
        SCHEMA_VERSION.finalized,
      );
      expect(await legacyStillThere()).toBe(false);
      // Second call is a no-op.
      expect(await finalizeLegacyMigration({mmkv, getState})).toBe(false);
    });

    it('keeps the legacy blob when the hydrated store does not match', async () => {
      const slices = legacySlices();
      await seedLegacy(slices);
      const mmkv = await bootstrapStorage();
      const getState = () => ({
        wallets: {allWallets: [slices.wallets.allWallets[0]]},
      });
      expect(await finalizeLegacyMigration({mmkv, getState})).toBe(false);
      expect(mmkv.getNumber(STORAGE_KEYS.schemaVersion)).toBe(
        SCHEMA_VERSION.migrated,
      );
      expect(await legacyStillThere()).toBe(true);
    });
  });

  it('migrateLegacyRoot2 returns "none" when there is no legacy blob', async () => {
    const mmkv = await bootstrapStorage();
    expect(await migrateLegacyRoot2({mmkv})).toEqual({status: 'none'});
  });
});
