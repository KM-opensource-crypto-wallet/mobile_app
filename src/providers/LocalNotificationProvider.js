import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import {store} from 'redux/store';
import {MainNavigation} from 'utils/navigation';
import {showToast} from 'utils/toast';
import {validateBigNumberStr} from 'dok-wallet-blockchain-networks/helper';
import {
  isWalletHiddenAndLocked,
  selectAllWallets,
  selectCurrentCoin,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  refreshCurrentCoin,
  setCurrentCoin,
  setCurrentWalletClientId,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  calculateEstimateFee,
  updateCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import {setRouteStateData} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';
import {
  deleteHiddenWalletsScheduledPayments,
  pruneExpiredScheduledPayments,
  syncScheduledPaymentNotifications,
} from 'dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSlice';
import {getAsyncStorageData, removeAsyncStorageData} from 'utils/asyncStorage';
import {getAvailableAmount} from 'hooks/useAvailableAmount';
import {findCoinForScheduledPayment} from 'utils/scheduledPaymentCoin';
import {
  SCHEDULED_PAYMENT_NOTIFICATION_TYPE,
  requestLocalNotificationPermission,
} from 'utils/scheduledPaymentNotifications';

// Generic fallback for a notification handler that can't resolve a specific
// screen (missing/stale data) - always land somewhere real instead of
// silently doing nothing. consumePendingLoginRedirect only knows whether a
// handler ran, not whether it navigated, so the base Login screen (no
// onClose) skips its own Sidebar fallback once any handler has been invoked -
// every path through these handlers needs to end in a real navigation.
const landOnHome = () => {
  MainNavigation.reset({
    index: 0,
    routes: [{name: 'Sidebar'}],
  });
};

// Land on `name` with Home directly underneath it. Used once a handler has
// switched the current wallet/coin in redux: every screen still mounted in the
// old stack (Home, SendScreen, the router-level header titles) reads
// selectCurrentCoin and would render the new wallet's data against the old
// wallet's route params, so back must never reveal them. A single reset also
// avoids the flicker of visiting Home first and then pushing, and on a cold
// start it stops back from landing on the Login screen.
const landOnHomeThen = (name, params) => {
  MainNavigation.reset({
    index: 1,
    routes: [{name: 'Sidebar'}, params ? {name, params} : {name}],
  });
};

// Where index.js's headless notifee.onBackgroundEvent parks a scheduled-
// payment PRESS it received while the app was backgrounded (not killed) —
// there's no safe navigation target from that headless context, so it just
// persists the payload here for this provider to pick up once JS is active.
export const SCHEDULED_PAYMENT_BACKGROUND_PRESS_STORAGE_KEY =
  'scheduledPaymentBackgroundPress';

export const LocalNotificationContext = createContext();

export const LocalNotificationProvider = ({children}) => {
  const [pendingScheduledPaymentData, setPendingScheduledPaymentDataState] =
    useState(null);
  const [pendingNotificationData, setPendingNotificationDataState] =
    useState(null);
  // Mirrors of the two states above, so consumePendingLoginRedirect can
  // atomically read-and-clear them. Cold start with a pending notification
  // mounts two LoginComponent instances at once (the base Login route and
  // LoginModal on top) - both can call this within the same tick, and state
  // setters alone aren't enough to make "only the first one handles it" safe
  // (the second's closure would still see the pre-update value).
  const pendingScheduledPaymentDataRef = useRef(null);
  const pendingNotificationDataRef = useRef(null);
  const setPendingScheduledPaymentData = useCallback(data => {
    pendingScheduledPaymentDataRef.current = data;
    setPendingScheduledPaymentDataState(data);
  }, []);
  const setPendingNotificationData = useCallback(data => {
    pendingNotificationDataRef.current = data;
    setPendingNotificationDataState(data);
  }, []);
  // Not component state - reveal happens via a plain tap handler on the
  // Wallets screen and needs to read/clear this synchronously in the same
  // handler, not on a later render.
  const pendingHiddenScheduledPaymentDataRef = useRef(null);

  const handleScheduledPaymentNotificationData = useCallback(async data => {
    if (!data?.walletClientId) {
      landOnHome();
      return;
    }
    const wallets = selectAllWallets(store.getState());
    const wallet = wallets.find(w => w.clientId === data.walletClientId);
    if (!wallet) {
      // Wallet no longer exists (e.g. deleted after this notification was
      // already delivered) - land on Home instead of leaving whoever
      // triggered this (e.g. the base Login screen) with nowhere to go.
      landOnHome();
      return;
    }
    if (isWalletHiddenAndLocked(wallet)) {
      // Don't silently drop it - the user asked to keep this notification
      // (Delete schedule notifications is off) despite the wallet being
      // hidden. Revealing it here would defeat Hide Wallet, so instead park
      // the data until they reveal it themselves via its secret code.
      pendingHiddenScheduledPaymentDataRef.current = data;
      showToast({
        type: 'warningToast',
        title: 'Scheduled payment',
        message:
          'This wallet is hidden. Enter its secret code on the Wallets screen to view this payment.',
      });
      // 'Wallets' is a Drawer.Screen nested inside 'Sidebar', not a
      // top-level route - navigate('Wallets') is a no-op when the current
      // route (e.g. 'Login' on a cold start) doesn't have Sidebar's Drawer
      // mounted yet. Land on Sidebar/Home first and let it do the nested
      // navigate once it's actually mounted, same as navigateToTransactionList.
      store.dispatch(setRouteStateData({navigateToWallets: true}));
      MainNavigation.reset({
        index: 0,
        routes: [{name: 'Sidebar'}],
      });
      return;
    }
    store.dispatch(setCurrentWalletClientId(wallet.clientId));

    const payment = (
      store.getState().schedulePayment?.scheduledPayments?.[wallet.clientId] ||
      []
    ).find(item => item?.id === data.scheduledPaymentId);
    // No matching payment (removed, or pruned once its schedule ran out) —
    // fall back to the list instead of prefilling a transfer for it.
    if (!payment) {
      landOnHomeThen('ViewSchedulePayment', {showAll: true});
      return;
    }

    const coin = findCoinForScheduledPayment(wallet, payment);
    if (!coin) {
      showToast({
        type: 'errorToast',
        title: 'Scheduled payment',
        message: `${
          payment.asset?.symbol || 'This coin'
        } is no longer in your wallet`,
      });
      // The payment's coin isn't in the wallet, so the list's default
      // current-token filter would hide the very item being looked for.
      landOnHomeThen('ViewSchedulePayment', {showAll: true});
      return;
    }

    store.dispatch(setCurrentCoin(coin._id));
    try {
      // Balance/fee validation below is only meaningful against a fresh
      // balance — the notification may fire hours or days after the coin
      // snapshot in redux was last refreshed.
      await store.dispatch(refreshCurrentCoin({})).unwrap();
    } catch (e) {
      console.warn(
        'Failed to refresh coin before scheduled payment transfer',
        e,
      );
    }

    const freshCoin = selectCurrentCoin(store.getState()) || coin;
    store.dispatch(
      updateCurrentTransferData({
        toAddress: payment.recipientAddress,
        currentCoin: freshCoin,
        amount: payment.amount,
        initialAmount: freshCoin?.type !== 'token' ? payment.amount : 0,
        isSendFunds: true,
        memo: payment.memo || undefined,
      }),
    );
    // Same fee-estimation thunk SendFunds uses — it also carries the
    // low-balance / insufficient-fee validation (toasts and clamps the
    // amount when the fee pushes the total over the available balance).
    store.dispatch(
      calculateEstimateFee({
        isFetchNonce: true,
        fromAddress: freshCoin?.address,
        toAddress: payment.recipientAddress,
        amount: validateBigNumberStr(payment.amount),
        contractAddress: freshCoin?.contractAddress,
        balance: getAvailableAmount(freshCoin),
        memo: payment.memo || undefined,
      }),
    );
    store.dispatch(setExchangeSuccess(false));
    landOnHomeThen('Transfer', {fromScreen: 'SendFunds'});
    // Transfer reads from currentTransfer, so a fired one-time payment can
    // now be pruned like any other expired one.
    await store.dispatch(pruneExpiredScheduledPayments());
    store.dispatch(syncScheduledPaymentNotifications());
  }, []);

  // Called right after a hidden wallet is revealed (by secret code) so a
  // scheduled-payment notification that arrived while it was still hidden
  // can resume where it left off, instead of just landing on Home.
  const consumePendingHiddenScheduledPayment = useCallback(
    walletClientId => {
      const data = pendingHiddenScheduledPaymentDataRef.current;
      if (!data || data.walletClientId !== walletClientId) {
        return false;
      }
      pendingHiddenScheduledPaymentDataRef.current = null;
      handleScheduledPaymentNotificationData(data);
      return true;
    },
    [handleScheduledPaymentNotificationData],
  );

  const handleNotificationData = useCallback(data => {
    if (!data?.chainName || !data?.coin) {
      landOnHome();
      return;
    }
    const wallets = selectAllWallets(store.getState());
    const wallet = data.walletId
      ? wallets.find(w => w.clientId === data.walletId)
      : wallets.find(w =>
          w.coins?.some(
            c =>
              c.chain_name === data.chainName &&
              c.symbol === data.coin &&
              c.isInWallet,
          ),
        );
    if (!wallet || isWalletHiddenAndLocked(wallet)) {
      landOnHome();
      return;
    }
    const coin = wallet.coins?.find(
      c =>
        c.chain_name === data.chainName &&
        c.symbol === data.coin &&
        c.isInWallet,
    );
    if (!coin) {
      landOnHome();
      return;
    }
    store.dispatch(setCurrentWalletClientId(wallet.clientId));
    store.dispatch(setCurrentCoin(coin._id));
    store.dispatch(setRouteStateData({navigateToTransactionList: true}));
    MainNavigation.reset({
      index: 0,
      routes: [{name: 'Sidebar'}],
    });
  }, []);

  // Single place that decides whether a just-completed login should resolve
  // a pending notification instead of the caller's default redirect. Reads
  // and clears the refs atomically so that whichever of the two concurrently
  // mounted LoginComponent instances (base Login route vs. LoginModal) calls
  // this first is the only one that actually runs the handler - the other
  // sees nothing pending and falls back to its own default behavior.
  const consumePendingLoginRedirect = useCallback(() => {
    const scheduledPaymentData = pendingScheduledPaymentDataRef.current;
    if (scheduledPaymentData) {
      pendingScheduledPaymentDataRef.current = null;
      setPendingScheduledPaymentDataState(null);
      handleScheduledPaymentNotificationData(scheduledPaymentData);
      return true;
    }
    const notificationData = pendingNotificationDataRef.current;
    if (notificationData) {
      pendingNotificationDataRef.current = null;
      setPendingNotificationDataState(null);
      handleNotificationData(notificationData);
      return true;
    }
    return false;
  }, [handleScheduledPaymentNotificationData, handleNotificationData]);

  // A scheduled-payment PRESS reaches JS through three doors: a cold-start
  // press via getInitialNotification, a foreground press via
  // onForegroundEvent, and a press while backgrounded-but-alive via
  // index.js's headless onBackgroundEvent (no safe navigation target there,
  // so it just persists the payload for us to pick up once JS is active).
  //
  // Every door funnels into setPendingScheduledPaymentData; the actual
  // handling happens later (after unlock). Expired payments are pruned here
  // too, and a one-time reminder that just fired is by definition past due —
  // so the prune must run only AFTER every async door has been checked, and
  // must skip whatever payment those doors turned up. Sequencing the two
  // async sources in one bootstrap (instead of two independent effects) is
  // what makes that ordering deterministic.
  useEffect(() => {
    const handleScheduledPaymentPress = notification => {
      const data = notification?.data;
      if (data?.type === SCHEDULED_PAYMENT_NOTIFICATION_TYPE) {
        setPendingScheduledPaymentData(data);
      }
    };

    const consumeInitialPress = async () => {
      try {
        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification?.notification) {
          handleScheduledPaymentPress(initialNotification.notification);
        }
      } catch (e) {
        console.warn('Failed to read initial notification', e);
      }
    };
    const consumeBackgroundPress = async () => {
      const raw = await getAsyncStorageData(
        SCHEDULED_PAYMENT_BACKGROUND_PRESS_STORAGE_KEY,
      );
      if (!raw) {
        return;
      }
      // Only act on the press once it can no longer be read back: if the key
      // could not be removed, leave it for the next activation to retry
      // instead of handling the same press again then.
      const removed = await removeAsyncStorageData(
        SCHEDULED_PAYMENT_BACKGROUND_PRESS_STORAGE_KEY,
      );
      if (!removed) {
        return;
      }
      try {
        const data = JSON.parse(raw);
        if (data?.type === SCHEDULED_PAYMENT_NOTIFICATION_TYPE) {
          setPendingScheduledPaymentData(data);
        }
      } catch (e) {
        console.warn('Failed to parse background scheduled payment press', e);
      }
    };
    // Prune, then make notifee match redux: reminders delivered while the
    // app was away freed slots, a repeating run may need to hand over to
    // its final one-shot, a far-future run may now be within repeat range.
    const pruneAroundPendingPress = async () => {
      await store.dispatch(
        pruneExpiredScheduledPayments({
          keepIds: [
            pendingScheduledPaymentDataRef.current?.scheduledPaymentId,
            pendingHiddenScheduledPaymentDataRef.current?.scheduledPaymentId,
          ],
        }),
      );
      store.dispatch(syncScheduledPaymentNotifications());
    };

    let cancelled = false;
    const bootstrap = async () => {
      await consumeInitialPress();
      await consumeBackgroundPress();
      if (!cancelled) {
        pruneAroundPendingPress();
      }
    };
    bootstrap();

    const unsubscribeNotifeeForeground = notifee.onForegroundEvent(
      ({type, detail}) => {
        if (type === EventType.PRESS) {
          handleScheduledPaymentPress(detail?.notification);
        } else if (
          type === EventType.DELIVERED &&
          detail?.notification?.data?.type ===
            SCHEDULED_PAYMENT_NOTIFICATION_TYPE
        ) {
          // A delivered one-shot no longer occupies a pending slot, and a
          // run's last-but-one firing means its final one-shot is due.
          store.dispatch(syncScheduledPaymentNotifications());
        }
      },
    );
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (nextAppState === 'active') {
          await consumeBackgroundPress();
          if (!cancelled) {
            pruneAroundPendingPress();
          }
        }
      },
    );
    return () => {
      cancelled = true;
      unsubscribeNotifeeForeground();
      subscription.remove();
    };
  }, [setPendingScheduledPaymentData]);

  const syncHiddenWalletsScheduledPayments = useCallback(
    () => store.dispatch(deleteHiddenWalletsScheduledPayments()),
    [],
  );

  const contextValue = useMemo(
    () => ({
      pendingScheduledPaymentData,
      setPendingScheduledPaymentData,
      handleScheduledPaymentNotificationData,
      consumePendingHiddenScheduledPayment,
      consumePendingLoginRedirect,
      pendingNotificationData,
      setPendingNotificationData,
      handleNotificationData,
      requestLocalNotificationPermission,
      syncHiddenWalletsScheduledPayments,
    }),
    [
      pendingScheduledPaymentData,
      setPendingScheduledPaymentData,
      handleScheduledPaymentNotificationData,
      consumePendingHiddenScheduledPayment,
      consumePendingLoginRedirect,
      pendingNotificationData,
      setPendingNotificationData,
      handleNotificationData,
      syncHiddenWalletsScheduledPayments,
    ],
  );

  return (
    <LocalNotificationContext.Provider value={contextValue}>
      {children}
    </LocalNotificationContext.Provider>
  );
};
