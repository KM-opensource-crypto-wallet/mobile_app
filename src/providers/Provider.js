import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  EventType,
  TriggerType,
} from '@notifee/react-native';
import BigNumber from 'bignumber.js';
import {store} from 'redux/store';
import {MainNavigation} from 'utils/navigation';
import {showToast} from 'utils/toast';
import {
  getCustomizePublicAddress,
  validateBigNumberStr,
} from 'dok-wallet-blockchain-networks/helper';
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
import {MAX_OCCURRENCES as MAX_SCHEDULED_PAYMENT_OCCURRENCE_NOTIFICATIONS} from 'utils/scheduleRecurrence';

// Mirrors the spendable-balance calc SendFunds uses (totalAmount minus the
// chain's minimum reserve), clamped at zero.
const getAvailableAmount = coin => {
  const availableBN = new BigNumber(coin?.totalAmount || '0').minus(
    new BigNumber(coin?.minimumBalance || '0'),
  );
  return availableBN.gt(0) ? availableBN.toFixed() : '0';
};

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

export const SCHEDULED_PAYMENT_NOTIFICATION_TYPE = 'scheduledPayment';
const SCHEDULED_PAYMENT_CHANNEL_ID = 'scheduled-payments';

let androidChannelCreated = false;

const ensureAndroidChannel = async () => {
  if (androidChannelCreated) {
    return;
  }
  await notifee.createChannel({
    id: SCHEDULED_PAYMENT_CHANNEL_ID,
    name: 'Scheduled Payments',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PRIVATE,
  });
  androidChannelCreated = true;
};

export const LocaoNotificationContext = createContext();

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
      store.getState().wallets?.scheduledPayments?.[wallet.clientId] || []
    ).find(item => item?.id === data.scheduledPaymentId);
    // No matching payment, or it was already sent/cancelled/edited away —
    // fall back to the list instead of prefilling a transfer for it.
    if (!payment || payment.status !== 'scheduled') {
      MainNavigation.navigate('ViewSchedulePayment');
      return;
    }

    const coin = wallet.coins?.find(
      c =>
        c.isInWallet &&
        c.chain_name === payment.chain &&
        c.symbol === payment.asset?.symbol &&
        (c.contractAddress || '') === (payment.asset?.contractAddress || ''),
    );
    if (!coin) {
      showToast({
        type: 'errorToast',
        title: 'Scheduled payment',
        message: `${
          payment.asset?.symbol || 'This coin'
        } is no longer in your wallet`,
      });
      MainNavigation.navigate('ViewSchedulePayment');
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
      }),
    );
    store.dispatch(setExchangeSuccess(false));
    MainNavigation.navigate({
      name: 'Transfer',
      params: {fromScreen: 'SendFunds'},
    });
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

  const requestLocalNotificationPermission = useCallback(async () => {
    try {
      const settings = await notifee.requestPermission();
      const granted =
        settings?.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings?.authorizationStatus === AuthorizationStatus.PROVISIONAL;
      return {
        granted,
        // DENIED after a request call (as opposed to NOT_DETERMINED) means
        // the OS won't show the permission dialog again — the user has to
        // flip it on from system settings.
        blocked:
          !granted &&
          settings?.authorizationStatus === AuthorizationStatus.DENIED,
      };
    } catch (e) {
      console.warn('Failed to request local notification permission', e);
      return {granted: false, blocked: false};
    }
  }, []);

  const createScheduledPaymentNotification = useCallback(
    async payment => {
      if (!payment?.id) {
        return {scheduled: false, blocked: false};
      }
      // A hidden wallet with "Delete schedule notifications" on must never
      // get a live reminder - guard creation itself rather than relying only
      // on HideWallet's Save action, since payments can be scheduled/edited
      // after that Save while the wallet is (or later becomes) hidden.
      const wallets = selectAllWallets(store.getState());
      const wallet = wallets.find(w => w.clientId === payment?.walletClientId);
      if (
        wallet &&
        isWalletHiddenAndLocked(wallet) &&
        wallet?.hideSettings?.deleteScheduleNotification
      ) {
        return {scheduled: false, blocked: false};
      }
      const occurrences = (
        Array.isArray(payment?.occurrences) && payment.occurrences.length
          ? payment.occurrences
          : [payment?.scheduledAt]
      )
        .map(Number)
        .filter(timestamp => timestamp && timestamp > Date.now())
        .slice(0, MAX_SCHEDULED_PAYMENT_OCCURRENCE_NOTIFICATIONS);
      if (!occurrences.length) {
        return {scheduled: false, blocked: false};
      }
      const {granted, blocked} = await requestLocalNotificationPermission();
      if (!granted) {
        return {scheduled: false, blocked};
      }
      try {
        await ensureAndroidChannel();
        await Promise.all(
          occurrences.map((timestamp, index) => {
            return notifee.createTriggerNotification(
              {
                id: `${payment.id}::${index}`,
                title: 'Scheduled payment ready',
                body: `Send ${payment?.amount ?? ''} ${
                  payment?.asset?.symbol ?? ''
                } to ${getCustomizePublicAddress(
                  payment?.recipientAddress,
                )} now${
                  occurrences.length > 1
                    ? ` (${index + 1} of ${occurrences.length})`
                    : ''
                }`,
                data: {
                  type: SCHEDULED_PAYMENT_NOTIFICATION_TYPE,
                  scheduledPaymentId: payment.id,
                  walletClientId: payment?.walletClientId ?? '',
                },
                android: {
                  channelId: SCHEDULED_PAYMENT_CHANNEL_ID,
                  pressAction: {id: 'default'},
                },
                ios: {
                  sound: 'default',
                },
              },
              {
                type: TriggerType.TIMESTAMP,
                timestamp,
              },
            );
          }),
        );
        return {scheduled: true, blocked: false};
      } catch (e) {
        console.warn('Failed to schedule local payment notification', e);
        return {scheduled: false, blocked: false};
      }
    },
    [requestLocalNotificationPermission],
  );

  const cancelScheduledPaymentNotification = useCallback(async id => {
    if (!id) {
      return;
    }
    try {
      await Promise.all(
        Array.from(
          {length: MAX_SCHEDULED_PAYMENT_OCCURRENCE_NOTIFICATIONS},
          (_, index) => notifee.cancelNotification(`${id}::${index}`),
        ),
      );
    } catch (e) {
      console.warn('Failed to cancel scheduled payment notification', e);
    }
  }, []);

  const cancelScheduledPaymentNotifications = useCallback(
    async ids => {
      const uniqueIds = [...new Set((ids || []).filter(Boolean))];
      if (!uniqueIds.length) {
        return;
      }
      await Promise.all(
        uniqueIds.map(id => cancelScheduledPaymentNotification(id)),
      );
    },
    [cancelScheduledPaymentNotification],
  );

  // Wallets can go from revealed to hidden+locked outside of HideWallet's own
  // Save flow - app relaunch (RELAUNCH relock, forced back on by the
  // persist-rehydrate transform) and backgrounding (BACKGROUND relock, via
  // rehideWalletsOnBackground). Neither of those cancels notifications on its
  // own, so call this right after either transition to sweep up any reminder
  // that should now be suppressed.
  const syncHiddenWalletsScheduledPaymentNotifications =
    useCallback(async () => {
      const state = store.getState();
      const wallets = selectAllWallets(state) || [];
      const scheduledPayments = state.wallets?.scheduledPayments || {};
      const idsToCancel = wallets
        .filter(
          wallet =>
            isWalletHiddenAndLocked(wallet) &&
            wallet?.hideSettings?.deleteScheduleNotification,
        )
        .flatMap(wallet =>
          (scheduledPayments[wallet.clientId] || [])
            .filter(item => item?.status === 'scheduled')
            .map(item => item?.id),
        );
      await cancelScheduledPaymentNotifications(idsToCancel);
    }, [cancelScheduledPaymentNotifications]);

  useEffect(() => {
    const handleScheduledPaymentPress = notification => {
      const data = notification?.data;
      if (data?.type === SCHEDULED_PAYMENT_NOTIFICATION_TYPE) {
        setPendingScheduledPaymentData(data);
      }
    };
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification?.notification) {
        handleScheduledPaymentPress(initialNotification.notification);
      }
    });
    const unsubscribeNotifeeForeground = notifee.onForegroundEvent(
      ({type, detail}) => {
        if (type === EventType.PRESS) {
          handleScheduledPaymentPress(detail?.notification);
        }
      },
    );
    return () => {
      unsubscribeNotifeeForeground();
    };
  }, [setPendingScheduledPaymentData]);

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
      createScheduledPaymentNotification,
      cancelScheduledPaymentNotification,
      cancelScheduledPaymentNotifications,
      syncHiddenWalletsScheduledPaymentNotifications,
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
      requestLocalNotificationPermission,
      createScheduledPaymentNotification,
      cancelScheduledPaymentNotification,
      cancelScheduledPaymentNotifications,
      syncHiddenWalletsScheduledPaymentNotifications,
    ],
  );

  return (
    <LocaoNotificationContext.Provider value={contextValue}>
      {children}
    </LocaoNotificationContext.Provider>
  );
};
