import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';
import {getCustomizePublicAddress} from 'dok-wallet-blockchain-networks/helper';
import {
  isWalletHiddenAndLocked,
  selectAllWallets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  MAX_OCCURRENCES as MAX_SCHEDULED_PAYMENT_OCCURRENCE_NOTIFICATIONS,
  computeOccurrences,
} from 'utils/scheduleRecurrence';

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

export const requestLocalNotificationPermission = async () => {
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
};

// getState is passed in (rather than importing the `store` singleton here)
// because this module is imported by schedulePaymentSlice.js, which is
// itself imported by redux/store.js — importing the store back from here
// would create a require cycle whose crash-or-not depends on which module
// Metro happens to load first.
export const createScheduledPaymentNotification = async (payment, getState) => {
  if (!payment?.id) {
    return {scheduled: false, blocked: false};
  }
  // A hidden wallet with "Delete schedule notifications" on must never
  // get a live reminder - guard creation itself rather than relying only
  // on HideWallet's Save action, since payments can be scheduled/edited
  // after that Save while the wallet is (or later becomes) hidden.
  const wallets = selectAllWallets(getState());
  const wallet = wallets.find(w => w.clientId === payment?.walletClientId);
  if (
    wallet &&
    isWalletHiddenAndLocked(wallet) &&
    wallet?.hideSettings?.deleteScheduleNotification
  ) {
    return {scheduled: false, blocked: false};
  }
  // The persisted schedule-payment record (e.g. what's re-read here when a
  // hidden wallet is un-hidden) never stores `occurrences` - only the
  // in-flight object built by submitScheduledPayment does. Recompute from
  // `recurrence` so a repeating payment gets its full remaining series back
  // instead of collapsing to (at most) its original first occurrence.
  const occurrences = (
    Array.isArray(payment?.occurrences) && payment.occurrences.length
      ? payment.occurrences
      : computeOccurrences({
          scheduledAt: payment?.scheduledAt,
          recurrence: payment?.recurrence,
        })
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
            } to ${getCustomizePublicAddress(payment?.recipientAddress)} now${
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
};

// fromIndex lets a caller that just recreated triggers for indices
// [0, fromIndex) leave those alone and only sweep up stale trailing slots
// left over from a previous, longer occurrence series (e.g. editing a
// recurring payment down to fewer future occurrences).
export const cancelScheduledPaymentNotification = async (id, fromIndex = 0) => {
  if (!id) {
    return;
  }
  try {
    await Promise.all(
      Array.from(
        {
          length: Math.max(
            0,
            MAX_SCHEDULED_PAYMENT_OCCURRENCE_NOTIFICATIONS - fromIndex,
          ),
        },
        (_, offset) =>
          notifee.cancelNotification(`${id}::${fromIndex + offset}`),
      ),
    );
  } catch (e) {
    console.warn('Failed to cancel scheduled payment notification', e);
  }
};

export const cancelScheduledPaymentNotifications = async ids => {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  if (!uniqueIds.length) {
    return;
  }
  await Promise.all(
    uniqueIds.map(id => cancelScheduledPaymentNotification(id)),
  );
};

// Wallets can go from revealed to hidden+locked outside of HideWallet's own
// Save flow - app relaunch (RELAUNCH relock, forced back on by the
// persist-rehydrate transform) and backgrounding (BACKGROUND relock, via
// rehideWalletsOnBackground). Neither of those cancels notifications on its
// own, so call this right after either transition to sweep up any reminder
// that should now be suppressed.
export const syncHiddenWalletsScheduledPaymentNotifications =
  async getState => {
    const state = getState();
    const wallets = selectAllWallets(state) || [];
    const scheduledPayments = state.schedulePayment?.scheduledPayments || {};
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
  };
