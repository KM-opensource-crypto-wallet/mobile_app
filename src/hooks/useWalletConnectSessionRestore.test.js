/**
 * useWalletConnectSessionRestore: restored dApp sessions only get their
 * listeners from subscribeWalletConnect, which needs the WalletKit client.
 * main.js flips extraData.isWalletConnectInitialized once WalletKit.init
 * resolves, which on a cold launch is AFTER Home (and this hook) mounted, so
 * the hook must run the restore when the flag flips, not only on mount.
 *
 *   npx jest src/hooks/useWalletConnectSessionRestore.test.js
 */
import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {
  extraDataSlice,
  setIsWalletConnectInitialized,
} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';
import {subscribeWalletConnect} from 'dok-wallet-blockchain-networks/service/walletconnect';
import {useWalletConnectSessionRestore} from 'hooks/useWalletConnectSessionRestore';

jest.mock('dok-wallet-blockchain-networks/service/walletconnect', () => ({
  subscribeWalletConnect: jest.fn(async () => {}),
}));
jest.mock('services/logger', () => ({captureError: jest.fn()}));
// walletsSelector imports chain helpers at load time; none are used by the
// session selectors exercised here.
jest.mock('dok-wallet-blockchain-networks/helper', () => ({}));

const SESSION_A = {topic: 't-a', pairingTopic: 'p-a'};
const SESSION_B = {topic: 't-b', pairingTopic: 'p-b'};

const walletsWith = (...sessions) => ({
  allWallets: sessions.map(session => ({session: {[session.topic]: session}})),
});

const SET_WALLETS = 'test/setWallets';
const walletsReducer = (state = walletsWith(SESSION_A), action) =>
  action.type === SET_WALLETS ? action.payload : state;

const renderHook = () => {
  const store = configureStore({
    reducer: {extraData: extraDataSlice.reducer, wallets: walletsReducer},
  });
  const Host = () => {
    useWalletConnectSessionRestore();
    return null;
  };
  act(() => {
    TestRenderer.create(
      <Provider store={store}>
        <Host />
      </Provider>,
    );
  });
  return store;
};

describe('useWalletConnectSessionRestore', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not subscribe before WalletKit is initialised', () => {
    renderHook();
    expect(subscribeWalletConnect).not.toHaveBeenCalled();
  });

  it("subscribes with every wallet's sessions once WalletKit is initialised", () => {
    const store = renderHook();
    act(() => {
      store.dispatch(setIsWalletConnectInitialized(true));
    });
    expect(subscribeWalletConnect).toHaveBeenCalledTimes(1);
    expect(subscribeWalletConnect).toHaveBeenCalledWith({'t-a': SESSION_A});
  });

  it('does not re-subscribe when sessions change later', () => {
    const store = renderHook();
    act(() => {
      store.dispatch(setIsWalletConnectInitialized(true));
    });
    act(() => {
      store.dispatch({
        type: SET_WALLETS,
        payload: walletsWith(SESSION_A, SESSION_B),
      });
    });
    expect(subscribeWalletConnect).toHaveBeenCalledTimes(1);
  });
});
