import * as mmkvModule from 'react-native-mmkv';
import * as secureStore from 'security/secureStore';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import * as rnsi from 'react-native-sensitive-info';
import {
  STATE_MMKV_ID,
  STORAGE_KEYS,
  SCHEMA_VERSION,
  bootstrapStorage,
  generateMmkvKey,
  getSchemaVersion,
  getStateStore,
  isStorageReady,
  resetBootstrap,
  setSchemaVersion,
} from 'redux/storage/bootstrap';
import {
  blockWrites,
  mmkvStorage,
  releaseBlockedWrites,
} from 'redux/storage/mmkvStorage';
import {Platform} from 'react-native';
import {
  wipeAllLocalData,
  removeLegacyRootBlob,
  LEGACY_ROOT_KEY,
  LEGACY_KEYCHAIN_SERVICE,
  LEGACY_SHARED_PREFERENCES,
} from 'redux/storage/wipe';
import {clearLegacySecureStorage} from 'myWallet/wallet.service';
import {
  SECURE_STORE_ERROR_CODES,
  SecureStoreError,
} from 'dok-wallet-blockchain-networks/security/errors';
import {captureError, logger} from 'services/logger';
import {moveFile} from 'react-native-fs';

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
  // iOS raw Keychain read (no RNSI metadata HMAC check).
  readKeychainValueUnverified: jest.fn(async (service, key) => {
    const {__mock} = jest.requireMock('react-native-sensitive-info');
    return __mock.items.get(`${service}::${key}`)?.value ?? null;
  }),
}));
// The MMKV mock keeps instances in memory: a "file" exists while its instance
// is registered, and moving it aside unregisters it.
jest.mock('react-native-fs', () => {
  const mmkv = jest.requireMock('react-native-mmkv');
  const idOf = path => path.split('/').pop();
  return {
    DocumentDirectoryPath: '/docs',
    mkdir: jest.fn(async () => {}),
    exists: jest.fn(async path =>
      path.endsWith('.crc') ? false : mmkv.__mock.instances.has(idOf(path)),
    ),
    moveFile: jest.fn(async from => {
      mmkv.__mock.instances.delete(idOf(from));
    }),
  };
});
jest.mock('utils/asyncStorage', () => ({
  getAsyncStorageData: jest.fn(async () => 'true'),
  storeAsyncStorageData: jest.fn(async () => {}),
}));

// Keep the real 600k KDF out of these tests; the vault's own suite covers it.
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

describe('storage bootstrap (mobile)', () => {
  beforeEach(() => {
    resetBootstrap();
    vault.__resetForTests();
    rnsi.__mock.reset();
    mmkvModule.__mock.reset();
    mmkvModule.createMMKV.mockClear();
    jest.clearAllMocks();
  });

  it('generates a 32-char key, stores it in the secure store and opens MMKV with it', async () => {
    expect(isStorageReady()).toBe(false);
    expect(() => getStateStore()).toThrow(/bootstrapStorage/);

    const store = await bootstrapStorage();

    const key = await secureStore.get(STORAGE_KEYS.mmkvKey);
    expect(key).toHaveLength(32);
    expect(mmkvModule.createMMKV).toHaveBeenCalledWith({
      id: STATE_MMKV_ID,
      encryptionKey: key,
      encryptionType: 'AES-256',
      recoveryStrategy: 'recover-on-error',
    });
    expect(store.getString(STORAGE_KEYS.installId)).toEqual(expect.any(String));
    expect(isStorageReady()).toBe(true);
    expect(getStateStore()).toBe(store);
    // No legacy blob: nothing to migrate, marker goes straight to finalized.
    expect(await getSchemaVersion()).toBe(SCHEMA_VERSION.finalized);
  });

  it('is memoised and reuses the stored key on a later runtime', async () => {
    const first = await bootstrapStorage();
    expect(await bootstrapStorage()).toBe(first);
    expect(mmkvModule.createMMKV).toHaveBeenCalledTimes(1);
    const key = await secureStore.get(STORAGE_KEYS.mmkvKey);
    const installId = first.getString(STORAGE_KEYS.installId);

    resetBootstrap(); // simulate a fresh JS runtime, same device
    const second = await bootstrapStorage();
    expect(mmkvModule.createMMKV).toHaveBeenLastCalledWith({
      id: STATE_MMKV_ID,
      encryptionKey: key,
      encryptionType: 'AES-256',
      recoveryStrategy: 'recover-on-error',
    });
    expect(second.getString(STORAGE_KEYS.installId)).toBe(installId);
  });

  it("generateMmkvKey stays within MMKV's 32-byte limit", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateMmkvKey()).toHaveLength(32);
    }
    expect(() =>
      mmkvModule.createMMKV({id: 'x', encryptionKey: 'a'.repeat(64)}),
    ).toThrow(/32 bytes/);
  });

  it('detects a reinstall (vault present, no MMKV file): replaces the stale key, keeps the vault', async () => {
    // Previous install: vault + key exist in the Keychain, MMKV file gone.
    await vault.createVault('pw');
    const wrap = await secureStore.get('vault.dek.password');
    await secureStore.set(
      STORAGE_KEYS.mmkvKey,
      'stale-key-stale-key-stale-key-12',
    );
    vault.lock();
    expect(mmkvModule.existsMMKV(STATE_MMKV_ID)).toBe(false);

    await bootstrapStorage();

    // The wallets' keys stay for "Restore wallets saved on this device".
    expect(await vault.hasVault()).toBe(true);
    expect(await secureStore.get('vault.dek.password')).toBe(wrap);
    expect(await secureStore.get(STORAGE_KEYS.mmkvKey)).not.toBe(
      'stale-key-stale-key-stale-key-12',
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'storage.reinstall_detected',
      expect.objectContaining({vaultKept: true}),
    );
    // No account in the fresh store next to that vault: reported.
    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({message: 'Vault found without an account'}),
      expect.anything(),
    );
  });

  it('never opens an existing store with a new key: the file is moved aside first', async () => {
    const first = await bootstrapStorage();
    first.set('persist:auth', JSON.stringify({hasAccount: 'true'}));
    // The key disappears from the Keychain while the encrypted file stays.
    await secureStore.remove(STORAGE_KEYS.mmkvKey);
    resetBootstrap();

    const second = await bootstrapStorage();

    expect(moveFile).toHaveBeenCalledWith(
      `/docs/mmkv/${STATE_MMKV_ID}`,
      expect.stringMatching(/^\/docs\/mmkv-unreadable\/dok\.state-\d+$/),
    );
    expect(second).not.toBe(first);
    expect(logger.error).toHaveBeenCalledWith(
      'storage.key_missing_store_set_aside',
      expect.anything(),
    );
  });

  it('logs every launch with whether an account is stored', async () => {
    const store = await bootstrapStorage();
    store.set('persist:auth', JSON.stringify({hasAccount: 'true'}));
    resetBootstrap();
    await bootstrapStorage();
    expect(logger.info).toHaveBeenLastCalledWith(
      'storage.bootstrapped',
      expect.objectContaining({hasAccount: true, reinstalled: false}),
    );
  });

  it('does not touch the vault when the MMKV file exists', async () => {
    await bootstrapStorage();
    await vault.createVault('pw');
    const wrap = await secureStore.get('vault.dek.password');
    resetBootstrap();
    await bootstrapStorage();
    expect(await secureStore.get('vault.dek.password')).toBe(wrap);
  });

  it('clears the memo on an `unavailable` failure so the next call retries', async () => {
    // e.g. a protected write the platform downgraded (secureStore.set) or a
    // web adapter without IndexedDB: the adapter reports `unavailable`.
    const spy = jest
      .spyOn(secureStore, 'get')
      .mockRejectedValueOnce(
        new SecureStoreError(SECURE_STORE_ERROR_CODES.UNAVAILABLE, 'locked'),
      );
    try {
      await expect(bootstrapStorage()).rejects.toMatchObject({
        code: 'unavailable',
      });
      expect(isStorageReady()).toBe(false);
      await expect(bootstrapStorage()).resolves.toBeDefined();
    } finally {
      spy.mockRestore();
    }
  });

  it('a failed read of an existing MMKV key is fatal, not "no key yet"', async () => {
    await bootstrapStorage();
    const key = await secureStore.get(STORAGE_KEYS.mmkvKey);
    resetBootstrap();
    rnsi.getItem.mockRejectedValueOnce(new Error('Keychain fetch failed'));
    await expect(bootstrapStorage()).rejects.toMatchObject({
      name: 'SecureStoreError',
    });
    // The stored key was not replaced by a fresh one.
    expect(await secureStore.get(STORAGE_KEYS.mmkvKey)).toBe(key);
  });

  // DOKWALLET-K: after a backup restore / Quick Start transfer to a new
  // iPhone, RNSI refuses every moved unprotected item (E_INTEGRITY_VIOLATION)
  // and the app never got past the storage error screen.
  describe('items moved to a new iPhone', () => {
    const service = {service: secureStore.SECURE_STORE_SERVICE};

    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('opens the transferred store with its original key', async () => {
      const first = await bootstrapStorage();
      first.set('persist:auth', JSON.stringify({hasAccount: 'true'}));
      const key = await secureStore.get(STORAGE_KEYS.mmkvKey);
      rnsi.__mock.tamper(STORAGE_KEYS.mmkvKey, service);
      resetBootstrap();

      const second = await bootstrapStorage();

      expect(mmkvModule.createMMKV).toHaveBeenLastCalledWith(
        expect.objectContaining({encryptionKey: key}),
      );
      expect(moveFile).not.toHaveBeenCalled();
      expect(second.getString('persist:auth')).toBe('{"hasAccount":"true"}');
    });

    it('after a reinstall there, keeps the vault and its password still unlocks it', async () => {
      await vault.createVault('pw');
      await vault.saveSecrets({wallets: ['w1']});
      vault.lock();
      rnsi.__mock.tamper('vault.dek.password', service);
      rnsi.__mock.tamper('vault.blob', service);
      expect(mmkvModule.existsMMKV(STATE_MMKV_ID)).toBe(false);

      await bootstrapStorage();

      expect(logger.warn).toHaveBeenCalledWith(
        'storage.reinstall_detected',
        expect.objectContaining({vaultKept: true}),
      );
      await vault.unlockWithPassword('pw');
      expect(await vault.readSecrets()).toEqual({wallets: ['w1']});
    });
  });

  it('schema version round-trips as a number', async () => {
    await setSchemaVersion(SCHEMA_VERSION.migrated);
    expect(await getSchemaVersion()).toBe(2);
  });

  describe('mmkvStorage (redux-persist adapter)', () => {
    it('awaits bootstrap and round-trips strings, null for missing', async () => {
      expect(await mmkvStorage.getItem('persist:auth')).toBeNull();
      await mmkvStorage.setItem('persist:auth', '{"a":"1"}');
      expect(await mmkvStorage.getItem('persist:auth')).toBe('{"a":"1"}');
      expect(getStateStore().getString('persist:auth')).toBe('{"a":"1"}');
      await mmkvStorage.removeItem('persist:auth');
      expect(await mmkvStorage.getItem('persist:auth')).toBeNull();
    });

    it('a key whose stored copy failed to load is never overwritten', async () => {
      await mmkvStorage.setItem('persist:messages', '{"kept":"1"}');
      blockWrites('persist:messages');
      // Refused, and reported as refused (not as written).
      await expect(
        mmkvStorage.setItem('persist:messages', '{"empty":"1"}'),
      ).rejects.toThrow('blocked');
      expect(await mmkvStorage.getItem('persist:messages')).toBe(
        '{"kept":"1"}',
      );
    });

    it('releasing a block writes the newest refused value and lifts it', async () => {
      await mmkvStorage.setItem('persist:auth', '{"kept":"1"}');
      blockWrites('persist:auth');
      await mmkvStorage.setItem('persist:auth', '{"r":"1"}').catch(() => {});
      await mmkvStorage.setItem('persist:auth', '{"r":"2"}').catch(() => {});
      await releaseBlockedWrites('persist:auth');
      expect(await mmkvStorage.getItem('persist:auth')).toBe('{"r":"2"}');
      await mmkvStorage.setItem('persist:auth', '{"r":"3"}');
      expect(await mmkvStorage.getItem('persist:auth')).toBe('{"r":"3"}');
    });

    it('a write refused while a release awaits bootstrap is the one written', async () => {
      await mmkvStorage.setItem('persist:auth', '{"kept":"1"}');
      blockWrites('persist:auth');
      await mmkvStorage.setItem('persist:auth', '{"r":"1"}').catch(() => {});
      const release = releaseBlockedWrites('persist:auth');
      // Still blocked: the release has not resumed from its await yet.
      await expect(
        mmkvStorage.setItem('persist:auth', '{"r":"2"}'),
      ).rejects.toThrow('blocked');
      await release;
      expect(await mmkvStorage.getItem('persist:auth')).toBe('{"r":"2"}');
    });

    it('releasing a block with nothing refused keeps the stored copy', async () => {
      await mmkvStorage.setItem('persist:wallets', '{"kept":"1"}');
      blockWrites('persist:wallets');
      await releaseBlockedWrites('persist:wallets');
      expect(await mmkvStorage.getItem('persist:wallets')).toBe('{"kept":"1"}');
    });
  });

  describe('wipeAllLocalData', () => {
    it('purges, destroys the vault, deletes the MMKV file, its key and the legacy blob', async () => {
      await bootstrapStorage();
      await mmkvStorage.setItem('persist:wallets', '{}');
      await vault.createVault('pw');
      await rnsi.setItem(LEGACY_ROOT_KEY, '{"legacy":true}', {
        service: LEGACY_KEYCHAIN_SERVICE,
        accessControl: 'none',
      });
      const persistor = {purge: jest.fn(async () => {})};

      await wipeAllLocalData({persistor});

      expect(persistor.purge).toHaveBeenCalled();
      expect(vault.isUnlocked()).toBe(false);
      expect(await vault.hasVault()).toBe(false);
      expect(mmkvModule.deleteMMKV).toHaveBeenCalledWith(STATE_MMKV_ID);
      expect(mmkvModule.existsMMKV(STATE_MMKV_ID)).toBe(false);
      expect(await secureStore.get(STORAGE_KEYS.mmkvKey)).toBeNull();
      expect(
        await rnsi.getItem(LEGACY_ROOT_KEY, {
          service: LEGACY_KEYCHAIN_SERVICE,
        }),
      ).toBeNull();
      expect(isStorageReady()).toBe(false);

      // A later bootstrap starts from nothing with a fresh key.
      const fresh = await bootstrapStorage();
      expect(fresh.getString('persist:wallets')).toBeUndefined();
    });

    it('removeLegacyRootBlob still clears the Android SharedPreferences blob when the secure-store delete rejects', async () => {
      const os = Platform.OS;
      Platform.OS = 'android';
      const real = rnsi.deleteItem.getMockImplementation();
      rnsi.deleteItem.mockImplementation(async () => {
        throw new Error('keystore busy');
      });
      clearLegacySecureStorage.mockClear();
      try {
        await expect(removeLegacyRootBlob()).rejects.toThrow('keystore busy');
        expect(clearLegacySecureStorage).toHaveBeenCalledWith(
          LEGACY_SHARED_PREFERENCES,
        );
      } finally {
        rnsi.deleteItem.mockImplementation(real);
        Platform.OS = os;
      }
    });

    it('keeps going after a failing step and rethrows the first error', async () => {
      await bootstrapStorage();
      const persistor = {
        purge: jest.fn(async () => {
          throw new Error('purge failed');
        }),
      };
      await expect(wipeAllLocalData({persistor})).rejects.toThrow(
        'purge failed',
      );
      expect(mmkvModule.deleteMMKV).toHaveBeenCalledWith(STATE_MMKV_ID);
    });
  });
});
