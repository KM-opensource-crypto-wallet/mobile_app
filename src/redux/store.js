import {createMigrate, persistReducer, persistStore} from 'redux-persist';
import {combineReducers, configureStore} from '@reduxjs/toolkit';

import {authSlice} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {settingsSlice} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {
  RELOCK_OPTIONS,
  walletsSlice,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {currentTransferSlice} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {currencySlice} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {exchangeSlice} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import {
  setReduxStoreLoaded,
  walletConnectSlice,
} from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSlice';
import {stakingSlice} from 'dok-wallet-blockchain-networks/redux/staking/stakingSlice';
import {cryptoProviderSlice} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProviderSlice';
import {extraDataSlice} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';
import {messageSlice} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {sellCryptoSlice} from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import {addressBookSlice} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSlice';
import {batchTransactionSlice} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import {notificationAlertsSlice} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import {customRpcSlice} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSlice';
import {coinSyncSlice} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSlice.js';
import {sentAddressHistorySlice} from 'dok-wallet-blockchain-networks/redux/sentAddressHistory/sentAddressHistorySlice';
import {exchangeHistorySlice} from 'dok-wallet-blockchain-networks/redux/exchangeHistory/exchangeHistorySlice';
import {schedulePaymentSlice} from 'dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSlice';
import {
  AUTH_PERSIST_BLACKLIST,
  batchTransactionPersistTransform,
  createMessagePersistTransform,
  createWalletsPersistTransform,
  schedulePaymentPersistTransform,
  sellCryptoPersistTransform,
} from 'dok-wallet-blockchain-networks/redux/storage/persistTransforms';
import {createVaultSync} from 'dok-wallet-blockchain-networks/security/vaultSync';
import {addBreadcrumb} from 'services/logger';
import {mmkvStorage} from './storage/mmkvStorage';
import {createTimedSerialize} from './storage/persistTiming';

// Persistence layout (docs/superpowers/specs/2026-09-19-secure-storage-final-plan.md):
//   - one redux-persist key per slice (`persist:auth`, `persist:wallets`, ...)
//     in the AES-256 MMKV store, so a balance refresh re-serialises one slice,
//     not the whole store, and never touches the platform secure store;
//   - wallet secrets (mnemonics, private keys, xprvs, hidden-wallet hashes)
//     are stripped on the way out by the wallets transform and live only in
//     the vault (security/vault.js), kept in step by the vaultSync listener;
//   - `timeout: 0` is mandatory: the default 5 s timer would rehydrate initial
//     state after a slow bootstrap and then persist it over the real data;
//   - `throttle: 1000` batches the write bursts that used to freeze the UI.
export const PERSIST_VERSION = 1;

// Slices that are never persisted (rebuilt from the network / per session).
const TRANSIENT_SLICES = [
  currentTransferSlice,
  exchangeSlice,
  exchangeHistorySlice,
  currencySlice,
  walletConnectSlice,
  extraDataSlice,
  cryptoProviderSlice,
  coinSyncSlice,
  stakingSlice,
];

const makePersistConfig = (slice, {blacklist, transforms} = {}) => ({
  key: slice.name,
  storage: mmkvStorage,
  version: PERSIST_VERSION,
  migrate: createMigrate({}, {debug: false}),
  timeout: 0,
  throttle: 1000,
  ...(blacklist ? {blacklist} : {}),
  ...(transforms ? {transforms} : {}),
  // Dev only: per-slice serialize timing (R9a evidence); read with
  // getPersistTimingStats() from redux/storage/persistTiming.
  ...(__DEV__ ? {serialize: createTimedSerialize(slice.name)} : {}),
});

const persisted = (slice, options) =>
  persistReducer(makePersistConfig(slice, options), slice.reducer);

export const rootReducer = combineReducers({
  [authSlice.name]: persisted(authSlice, {blacklist: AUTH_PERSIST_BLACKLIST}),
  [walletsSlice.name]: persisted(walletsSlice, {
    transforms: [
      createWalletsPersistTransform({
        manualRelockOption: RELOCK_OPTIONS.MANUAL,
      }),
    ],
  }),
  [settingsSlice.name]: persisted(settingsSlice),
  [messageSlice.name]: persisted(messageSlice, {
    transforms: [createMessagePersistTransform()],
  }),
  [sellCryptoSlice.name]: persisted(sellCryptoSlice, {
    transforms: [sellCryptoPersistTransform],
  }),
  [addressBookSlice.name]: persisted(addressBookSlice),
  [batchTransactionSlice.name]: persisted(batchTransactionSlice, {
    transforms: [batchTransactionPersistTransform],
  }),
  [notificationAlertsSlice.name]: persisted(notificationAlertsSlice),
  [customRpcSlice.name]: persisted(customRpcSlice),
  [sentAddressHistorySlice.name]: persisted(sentAddressHistorySlice),
  [schedulePaymentSlice.name]: persisted(schedulePaymentSlice, {
    transforms: [schedulePaymentPersistTransform],
  }),
  ...Object.fromEntries(
    TRANSIENT_SLICES.map(slice => [slice.name, slice.reducer]),
  ),
});

// Every failed thunk (~40 of them: exchange quotes, staking, currency, batch)
// becomes a breadcrumb on the next error report. Only the error message and a
// string payload are recorded; object payloads can carry wallet data.
const rejectedActionBreadcrumb = () => next => action => {
  if (typeof action?.type === 'string' && action.type.endsWith('/rejected')) {
    addBreadcrumb(
      'redux',
      action.type,
      {
        error: action.error?.message,
        payload:
          typeof action.payload === 'string' ? action.payload : undefined,
      },
      'warning',
    );
  }
  return next(action);
};

// Mirrors wallet secrets into the vault (immediately for wallet-creating
// actions, debounced otherwise) and destroys it on resetWallet. `flush()` is
// called from the background lifecycle handler next to persistor.flush().
export const vaultSync = createVaultSync();

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    })
      .prepend(vaultSync.middleware)
      .concat(rejectedActionBreadcrumb),
});

let persistor = persistStore(store, null, () => {
  setTimeout(() => {
    store.dispatch(setReduxStoreLoaded(true));
  }, 500);
});

export {persistor, store};
