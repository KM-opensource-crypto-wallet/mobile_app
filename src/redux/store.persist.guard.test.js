/**
 * The real root reducer + redux-persist + MMKV mock: after secret-bearing
 * actions, nothing that reaches the state store may contain a secret, and the
 * vault must hold exactly what the wallets slice holds.
 */
import * as mmkvModule from 'react-native-mmkv';
import * as rnsi from 'react-native-sensitive-info';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {
  assertNoSecrets,
  extractVaultPayload,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletSecrets';
import {parsePersistEnvelope} from 'dok-wallet-blockchain-networks/redux/storage/legacyRootMigration';
import {
  logOutSuccess,
  signUpSuccess,
  vaultUnlocked,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {
  setWalletConnectWalletData,
  setWalletHideSettings,
  resetWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

jest.mock('dok-wallet-blockchain-networks/cryptoChain', () => ({
  getChain: jest.fn(),
  getCoin: jest.fn(),
  getHashString: jest.fn(),
}));
jest.mock('utils/wlData', () => ({
  WL_APP_NAME: 'Dok Wallet',
  IS_KIML_WALLET: false,
  wlName: 'dokwallet',
  WALLET_CONNECT_DATA: {},
}));
jest.mock('myWallet/wallet.service', () => ({
  addCustomDeriveAddressToWallet: jest.fn(),
  addDeriveAddresses: jest.fn(),
  generateMnemonics: jest.fn(),
  getLegacySecureValue: jest.fn(async () => null),
  clearLegacySecureStorage: jest.fn(async () => {}),
}));
jest.mock('dok-wallet-blockchain-networks/service/dokApi', () => ({
  fetchCoinByChainAPI: jest.fn(),
  fetchCurrenciesAPI: jest.fn(),
  registerUserAPI: jest.fn(() => Promise.resolve()),
  reportExchangeTransactionHash: jest.fn(),
}));
jest.mock('dok-wallet-blockchain-networks/service/coinMarketCap', () => ({
  getPrice: jest.fn(() => Promise.resolve({})),
}));
jest.mock('utils/scheduledPaymentNotifications', () => ({
  SCHEDULED_PAYMENT_NOTIFICATION_TYPE: 'scheduledPayment',
  SCHEDULED_PAYMENT_BACKGROUND_PRESS_STORAGE_KEY:
    'scheduledPaymentBackgroundPress',
  MAX_PENDING_TRIGGER_NOTIFICATIONS: 50,
  requestLocalNotificationPermission: jest.fn(),
  collectPaymentsForReminders: jest.fn(() => []),
  getReminderSlotUsage: jest.fn(() => ({})),
  getPaymentIdsWithDisplayedReminders: jest.fn(async () => []),
  cancelDisplayedRemindersForPayment: jest.fn(),
  reconcileScheduledPaymentNotifications: jest.fn(),
  createScheduledPaymentNotification: jest.fn(),
}));
jest.mock('utils/xmtp', () => ({}));
jest.mock('utils/asyncStorage', () => ({
  getAsyncStorageData: jest.fn(async () => 'true'),
  storeAsyncStorageData: jest.fn(async () => {}),
  clearWalletConnectStorageCache: jest.fn(async () => {}),
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
const newStoreWallet = () => ({
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
        {address: '0xa0', derivePath: "m/44'/60'/0'/0/0", privateKey: HEX(1)},
      ],
      transactions: Array.from({length: 250}, (_, i) => ({
        hash: `tx-${i}`,
        date: 1700000000000 + i,
      })),
    },
    {
      _id: 'c2',
      chain_name: 'bitcoin',
      symbol: 'BTC',
      address: 'bc1q',
      privateKey: 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ',
      extendedPrivateKey:
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
    },
  ],
  chain_existing_coin: {},
  nft: {Ethereum_data: [{token: 'heavy'}]},
});

const waitFor = (predicate, {timeout = 4000} = {}) =>
  new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (predicate()) {
        resolve();
      } else if (Date.now() - started > timeout) {
        reject(new Error('waitFor timed out'));
      } else {
        setTimeout(tick, 10);
      }
    };
    tick();
  });

describe('store persistence guard', () => {
  let store;
  let persistor;
  let vaultSync;
  let mmkv;

  beforeAll(async () => {
    rnsi.__mock.reset();
    mmkvModule.__mock.reset();
    vault.__resetForTests();
    ({store, persistor, vaultSync} = require('redux/store'));
    await waitFor(() => persistor.getState().bootstrapped);
    mmkv = mmkvModule.__mock.instances.get('dok.state');
  });

  const persistedValues = () =>
    Object.fromEntries(
      mmkv
        .getAllKeys()
        .filter(k => k.startsWith('persist:'))
        .map(k => [k, parsePersistEnvelope(mmkv.getString(k))]),
    );

  it('writes one key per persisted slice, none for transient slices', async () => {
    store.dispatch(signUpSuccess('Secret123!'));
    await persistor.flush();
    const keys = mmkv
      .getAllKeys()
      .filter(k => k.startsWith('persist:'))
      .sort();
    expect(keys).toEqual(
      [
        'persist:addressBook',
        'persist:auth',
        'persist:batchTransaction',
        'persist:customRpc',
        'persist:message',
        'persist:notificationAlerts',
        'persist:schedulePayment',
        'persist:sellCrypto',
        'persist:sentAddressHistory',
        'persist:settings',
        'persist:wallets',
      ].sort(),
    );
    expect(keys).not.toContain('persist:currentTransfer');
    expect(keys).not.toContain('persist:walletConnect');
  });

  it('never persists the password or the unlock flag', async () => {
    store.dispatch(vaultUnlocked());
    await persistor.flush();
    const auth = persistedValues()['persist:auth'];
    expect(auth.hasAccount).toBe(true);
    expect(auth.password).toBeUndefined();
    expect(auth.isVaultUnlocked).toBeUndefined();
    expect(auth.loading).toBeUndefined();
    expect(auth._persist.version).toBe(1);
  });

  it('strips every secret from persisted wallets and mirrors them into the vault', async () => {
    await vault.createVault('Secret123!');
    store.dispatch({
      type: 'wallets/createWallet/fulfilled',
      payload: {newStoreWallet: newStoreWallet(), isFromImportWallet: false},
    });
    store.dispatch(
      setWalletConnectWalletData({
        'session-1': [
          {
            address: '0xa0',
            chain_name: 'ethereum',
            privateKey: HEX(1),
            transactions: [{hash: 'x'}],
          },
        ],
      }),
    );
    store.dispatch(
      setWalletHideSettings({
        clientId: 'w1',
        secretCodeSalt: 'b'.repeat(32),
        secretCodeHash: 'a'.repeat(64),
        secretCodeIterations: 100000,
        relockOption: 'MANUAL',
      }),
    );
    await persistor.flush();
    await vaultSync.flush();

    // In memory: everything is there.
    const live = store.getState().wallets.allWallets[0];
    expect(live.phrase).toBe(MNEMONIC);
    expect(live.coins[1].extendedPrivateKey).toMatch(/^xprv/);

    // At rest: nothing.
    const values = persistedValues();
    for (const [key, value] of Object.entries(values)) {
      expect(() =>
        assertNoSecrets(value, {allowHexKeys: ['secretCodeHash']}),
      ).not.toThrow(key);
    }
    const persistedWallet = values['persist:wallets'].allWallets[0];
    expect(persistedWallet.walletName).toBe('Main');
    expect(persistedWallet.coins[0].address).toBe('0xa0');
    expect(persistedWallet.coins[0].deriveAddresses[0].derivePath).toBe(
      "m/44'/60'/0'/0/0",
    );
    expect(persistedWallet.hideSettings.relockOption).toBe('MANUAL');
    // Slimming: transactions capped to the newest 200, nft cache not persisted.
    expect(persistedWallet.coins[0].transactions).toHaveLength(200);
    expect(persistedWallet.coins[0].transactions[0].hash).toBe('tx-249');
    expect(persistedWallet.nft).toBeUndefined();
    expect(
      persistedWallet.walletData['session-1'][0].transactions,
    ).toBeUndefined();
    expect(persistedWallet.hideSettings.secretCodeHash).toBeUndefined();
    expect(
      persistedWallet.walletData['session-1'][0].privateKey,
    ).toBeUndefined();

    // Vault holds exactly the live secrets.
    expect(await vault.readSecrets()).toEqual(
      extractVaultPayload(store.getState().wallets.allWallets),
    );
  });

  it('resetWallet empties the vault; logOutSuccess destroys it', async () => {
    store.dispatch(resetWallet());
    await vaultSync.flush();
    await persistor.flush();
    expect(await vault.hasVault()).toBe(true);
    expect(await vault.readSecrets()).toEqual({v: 1, wallets: {}});
    expect(persistedValues()['persist:wallets'].allWallets).toEqual([]);

    store.dispatch(logOutSuccess());
    await vaultSync.flush();
    expect(await vault.hasVault()).toBe(false);
    expect(vault.isUnlocked()).toBe(false);
  });

  // Reported bug: reset wallet → create/import a wallet → quit → relaunch →
  // login → the wallet is gone (no "missing keys" report either).
  it('REPRO: after reset+logout, a new vault + new wallet survive a relaunch', async () => {
    // Registration after the reset.
    await vault.createVault('NewPass1!');
    store.dispatch(signUpSuccess());
    // Import a wallet (what the real thunk's fulfilled reducer receives).
    const imported = {...newStoreWallet(), clientId: 'w2', walletName: 'New'};
    store.dispatch({
      type: 'wallets/createWallet/fulfilled',
      payload: {newStoreWallet: imported, isFromImportWallet: true},
    });
    expect(store.getState().wallets.allWallets).toHaveLength(1);

    // "Quit": background flushes.
    await persistor.flush();
    await vaultSync.flush();

    // What is on disk after the quit?
    const persistedWallets = persistedValues()['persist:wallets'].allWallets;
    expect(persistedWallets.map(w => w.clientId)).toEqual(['w2']);
    const secrets = await vault.readSecrets();
    expect(Object.keys(secrets.wallets)).toEqual(['w2']);

    // "Relaunch + login": rehydrate the stripped slice, merge the vault back.
    vault.lock();
    const payload = await vault.unlockWithPassword('NewPass1!');
    const {
      hydrateWalletSecrets,
    } = require('dok-wallet-blockchain-networks/redux/wallets/walletSecrets');
    const hydrated = hydrateWalletSecrets(persistedWallets, payload);
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0].phrase).toBe(MNEMONIC);
  });

  // The actual bug: redux-persist serialises one top-level field per
  // `throttle` tick and writes the slice only once every changed field has
  // been processed, so with throttle 1000 a new wallet reached MMKV ~7-9 s
  // after creation. Quitting inside that window lost the wallet (its keys were
  // already in the vault, orphaned). No explicit flush here on purpose.
  it('a new wallet reaches MMKV right away, not after a multi-second throttle window', async () => {
    const fast = {...newStoreWallet(), clientId: 'w-fast', walletName: 'Fast'};
    store.dispatch({
      type: 'wallets/createWallet/fulfilled',
      payload: {newStoreWallet: fast, isFromImportWallet: true},
    });
    await waitFor(
      () =>
        (persistedValues()['persist:wallets']?.allWallets || []).some(
          w => w.clientId === 'w-fast',
        ),
      {timeout: 1500},
    );
    await vaultSync.flush();
    expect(Object.keys((await vault.readSecrets()).wallets)).toContain(
      'w-fast',
    );
  });
});
