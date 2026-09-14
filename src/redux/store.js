import {
  persistStore,
  persistCombineReducers,
  createTransform,
} from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';
import {configureStore} from '@reduxjs/toolkit';

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
import {addBreadcrumb} from 'services/logger';

const storage = createSensitiveStorage({
  keychainService: process.env.REDUX_KEYCHAIN_NAME,
  /* Don't delete this line in newer react-native-sensitive-info this is deleted,
   we are doing migration for android so it is for code reference */
  // sharedPreferencesName: process.env.REDUX_SHARED_PREFERENCE_NAME,
  accessControl: 'none',
});
const walletsPersistTransform = createTransform(
  inboundState => ({
    ...inboundState,
    allWallets: inboundState?.allWallets?.map(wallet =>
      wallet?.hideSettings &&
      wallet.hideSettings.relockOption !== RELOCK_OPTIONS.MANUAL
        ? {...wallet, hideSettings: {...wallet.hideSettings, isHidden: true}}
        : wallet,
    ),
  }),
  outboundState => {
    // In-flight "refresh all wallets" progress is UI state, not data: a
    // rehydrated `true` (app quit mid-refresh) would leave the button
    // spinning and disabled with no thunk left to clear it.
    const refreshReset = {
      isRefreshingAllWallets: false,
      refreshingWalletClientId: null,
      // Per-wallet requestIds of in-flight refreshCoins: none survive a quit.
      refreshCoinsRequestIds: {},
    };
    // One-time migration for users persisted currentWalletIndex
    if (outboundState?.currentWalletClientId) {
      return {...outboundState, ...refreshReset};
    }
    const allWallets = outboundState?.allWallets?.map(wallet => ({
      ...wallet,
      clientId: wallet?.clientId,
    }));
    const {currentWalletIndex, ...restState} = outboundState || {};
    return {
      ...restState,
      ...refreshReset,
      allWallets,
      currentWalletClientId:
        allWallets?.[currentWalletIndex]?.clientId ||
        allWallets?.[0]?.clientId ||
        null,
    };
  },
  {whitelist: [walletsSlice.name]},
);
// isSubmitting is in-flight UI state, not data — a rehydrated `true` (e.g.
// the app was killed mid-submit) would leave the submit button permanently
// disabled with no pending thunk left to ever flip it back. scheduledPayments
// itself must still persist (it's the actual schedule data), so only reset
// this one field on load rather than blacklisting the whole slice.
const schedulePaymentPersistTransform = createTransform(
  inboundState => inboundState,
  outboundState => ({
    ...outboundState,
    isSubmitting: false,
    pendingSubmitCount: 0,
  }),
  {whitelist: [schedulePaymentSlice.name]},
);

const config = {
  key: process.env.REDUX_KEY,
  storage,
  transforms: [walletsPersistTransform, schedulePaymentPersistTransform],
  blacklist: [
    currentTransferSlice.name,
    exchangeSlice.name,
    exchangeHistorySlice.name,
    currencySlice.name,
    walletConnectSlice.name,
    extraDataSlice.name,
    cryptoProviderSlice.name,
    coinSyncSlice.name,
    stakingSlice.name,
  ],
};

const rootReducer = persistCombineReducers(config, {
  [authSlice.name]: authSlice.reducer,
  // [coinsSlice.name]: coinsSlice.reducer,
  [walletsSlice.name]: walletsSlice.reducer,
  [settingsSlice.name]: settingsSlice.reducer,
  [currentTransferSlice.name]: currentTransferSlice.reducer,
  [currencySlice.name]: currencySlice.reducer,
  [exchangeSlice.name]: exchangeSlice.reducer,
  [exchangeHistorySlice.name]: exchangeHistorySlice.reducer,
  [walletConnectSlice.name]: walletConnectSlice.reducer,
  [stakingSlice.name]: stakingSlice.reducer,
  [cryptoProviderSlice.name]: cryptoProviderSlice.reducer,
  [extraDataSlice.name]: extraDataSlice.reducer,
  [messageSlice.name]: messageSlice.reducer,
  [sellCryptoSlice.name]: sellCryptoSlice.reducer,
  [addressBookSlice.name]: addressBookSlice.reducer,
  [batchTransactionSlice.name]: batchTransactionSlice.reducer,
  [notificationAlertsSlice.name]: notificationAlertsSlice.reducer,
  [customRpcSlice.name]: customRpcSlice.reducer,
  [coinSyncSlice.name]: coinSyncSlice.reducer,
  [sentAddressHistorySlice.name]: sentAddressHistorySlice.reducer,
  [schedulePaymentSlice.name]: schedulePaymentSlice.reducer,
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

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(rejectedActionBreadcrumb),
});

let persistor = persistStore(store, null, () => {
  setTimeout(() => {
    store.dispatch(setReduxStoreLoaded(true));
  }, 500);
});

export {persistor, store};
