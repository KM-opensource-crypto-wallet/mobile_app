import {createContext, useCallback, useEffect, useMemo, useState} from 'react';
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

export const locaoNotificationContext = createContext();

export const LocalNotificationProvider = ({children}) => {
  const [pendingScheduledPaymentData, setPendingScheduledPaymentData] =
    useState(null);
  const [pendingNotificationData, setPendingNotificationData] = useState(null);

  const handleScheduledPaymentNotificationData = useCallback(async data => {
    if (!data?.walletClientId) {
      return;
    }
    const wallets = selectAllWallets(store.getState());
    const wallet = wallets.find(w => w.clientId === data.walletClientId);
    if (!wallet || isWalletHiddenAndLocked(wallet)) {
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

  const handleNotificationData = useCallback(data => {
    if (!data?.chainName || !data?.coin) {
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
      return;
    }
    const coin = wallet.coins?.find(
      c =>
        c.chain_name === data.chainName &&
        c.symbol === data.coin &&
        c.isInWallet,
    );
    if (!coin) {
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
  }, []);

  const contextValue = useMemo(
    () => ({
      pendingScheduledPaymentData,
      setPendingScheduledPaymentData,
      handleScheduledPaymentNotificationData,
      pendingNotificationData,
      setPendingNotificationData,
      handleNotificationData,
      requestLocalNotificationPermission,
      createScheduledPaymentNotification,
      cancelScheduledPaymentNotification,
      cancelScheduledPaymentNotifications,
    }),
    [
      pendingScheduledPaymentData,
      handleScheduledPaymentNotificationData,
      pendingNotificationData,
      handleNotificationData,
      requestLocalNotificationPermission,
      createScheduledPaymentNotification,
      cancelScheduledPaymentNotification,
      cancelScheduledPaymentNotifications,
    ],
  );

  return (
    <locaoNotificationContext.Provider value={contextValue}>
      {children}
    </locaoNotificationContext.Provider>
  );
};
