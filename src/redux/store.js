import {persistStore, persistCombineReducers} from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';
import {configureStore} from '@reduxjs/toolkit';

import {authSlice} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {settingsSlice} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {walletsSlice} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
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
import {batchTransactionSlice} from '../../dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import {customRpcSlice} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSlice';
import {coinSyncSlice} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSlice.js';

const storage = createSensitiveStorage({
  keychainService: process.env.REDUX_KEYCHAIN_NAME,
  /* Don't delete this line in newer react-native-sensitive-info this is deleted,
   we are doing migration for android so it is for code reference */
  // sharedPreferencesName: process.env.REDUX_SHARED_PREFERENCE_NAME,
  accessControl: 'none',
});

const config = {
  key: process.env.REDUX_KEY,
  storage,
  blacklist: [
    currentTransferSlice.name,
    exchangeSlice.name,
    currencySlice.name,
    walletConnectSlice.name,
    extraDataSlice.name,
    cryptoProviderSlice.name,
    coinSyncSlice.name,
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
  [walletConnectSlice.name]: walletConnectSlice.reducer,
  [stakingSlice.name]: stakingSlice.reducer,
  [cryptoProviderSlice.name]: cryptoProviderSlice.reducer,
  [extraDataSlice.name]: extraDataSlice.reducer,
  [messageSlice.name]: messageSlice.reducer,
  [sellCryptoSlice.name]: sellCryptoSlice.reducer,
  [addressBookSlice.name]: addressBookSlice.reducer,
  [batchTransactionSlice.name]: batchTransactionSlice.reducer,
  [customRpcSlice.name]: customRpcSlice.reducer,
  [coinSyncSlice.name]: coinSyncSlice.reducer,
});

// Logging middleware
const logger = storeAPI => next => action => {
  console.log('Dispatching action:', action);
  console.log('Source component:', action.meta?.source);
  let result = next(action);
  console.log('New state:', JSON.stringify(storeAPI.getState()));
  return result;
};

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }), // Add the logger to the middleware chain
});

let persistor = persistStore(store, null, () => {
  setTimeout(() => {
    store.dispatch(setReduxStoreLoaded(true));
  }, 500);
});
// persistor.purge();
export {persistor, store};
