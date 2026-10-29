import {useEffect} from 'react';
import {shallowEqual, useSelector} from 'react-redux';
import {getIsWalletConnectInitialized} from 'dok-wallet-blockchain-networks/redux/extraData/extraSelectors';
import {selectAllWalletConnectSessions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {subscribeWalletConnect} from 'dok-wallet-blockchain-networks/service/walletconnect';
import {captureError} from 'services/logger';

// Attaches the WalletConnect listeners for sessions restored from a previous
// run. main.js starts WalletKit.init only after the vault unlocks, which is
// the same tick Home mounts, so on a cold launch the client does not exist
// yet when this first runs; subscribeWalletConnect then returns without
// latching. main.js flips isWalletConnectInitialized once init resolves, and
// the effect re-runs on that flip. The service latches after its first
// successful call, so a re-run after that is a no-op (same as the web app's
// WalletConnectStatus).
export const useWalletConnectSessionRestore = () => {
  const isInitialized = useSelector(getIsWalletConnectInitialized);
  const allSessions = useSelector(selectAllWalletConnectSessions, shallowEqual);
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    subscribeWalletConnect(allSessions).catch(e =>
      captureError(e, {tags: {area: 'walletconnect', op: 'subscribe'}}),
    );
    // allSessions is only the snapshot handed to the one-time subscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);
};
