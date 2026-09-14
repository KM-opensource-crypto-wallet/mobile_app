import {Platform} from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import {getCustomizePublicAddress} from 'dok-wallet-blockchain-networks/helper';
import {
  isWalletHiddenAndLocked,
  selectAllWallets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  TRIGGER_KIND,
  TRIGGER_REPEAT,
  applyTriggerLimit,
  countTriggersForPayments,
  diffTriggerIds,
  parseTriggerId,
  planScheduledPaymentTriggers,
} from 'utils/scheduledPaymentTriggerPlan';

export const SCHEDULED_PAYMENT_NOTIFICATION_TYPE = 'scheduledPayment';
const SCHEDULED_PAYMENT_CHANNEL_ID = 'scheduled-payments';

// Pending local notifications the OS will hold for one app: Apple's
// long-standing limit of 64 requests; notifee documents 50 timestamp
// triggers on Android. This feature is the only creator of trigger
// notifications in the app, so the whole allowance is ours.
export const MAX_PENDING_TRIGGER_NOTIFICATIONS =
  Platform.OS === 'android' ? 50 : 64;

const REPEAT_FREQUENCY_BY_REPEAT = {
  [TRIGGER_REPEAT.DAILY]: RepeatFrequency.DAILY,
  [TRIGGER_REPEAT.WEEKLY]: RepeatFrequency.WEEKLY,
};

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

// Every payment that should have reminders, each tagged with its
// walletClientId (the redux record is keyed by wallet, not tagged). A hidden
// wallet with "Delete schedule notifications" on gets none — its payments
// are deleted on relock anyway, and this keeps a payment scheduled while it
// was revealed from ever arming a reminder. `include` is a payment being
// created or edited right now (not yet in redux); it replaces any stored
// version of itself. `excludeId` leaves a stored payment out instead.
export const collectPaymentsForReminders = (
  state,
  {include, excludeId} = {},
) => {
  const skipId = include?.id ?? excludeId;
  const wallets = selectAllWallets(state) || [];
  const scheduledPayments = state.schedulePayment?.scheduledPayments || {};
  const payments = [];
  Object.entries(scheduledPayments).forEach(([walletClientId, list]) => {
    const wallet = wallets.find(w => w.clientId === walletClientId);
    if (
      wallet &&
      isWalletHiddenAndLocked(wallet) &&
      wallet?.hideSettings?.deleteScheduleNotification
    ) {
      return;
    }
    (Array.isArray(list) ? list : []).forEach(item => {
      if (item?.id && item.id !== skipId) {
        payments.push({...item, walletClientId});
      }
    });
  });
  if (include?.id) {
    payments.push(include);
  }
  return payments;
};

// Pending-notification slots in use vs. the device limit. The one
// definition of "used" for both the create-time limit check and the list
// header, so the numbers the user sees always add up.
export const getReminderSlotUsage = (state, {excludeId} = {}) => ({
  used: countTriggersForPayments(
    collectPaymentsForReminders(state, {excludeId}),
  ),
  limit: MAX_PENDING_TRIGGER_NOTIFICATIONS,
});

// The single place a reminder's content is built.
const buildTriggerNotification = entry => {
  const {payment} = entry;
  const target = `Send ${payment?.amount ?? ''} ${
    payment?.asset?.symbol ?? ''
  } to ${getCustomizePublicAddress(payment?.recipientAddress)} now`;
  // A repeating trigger's text is fixed for every firing, so only a
  // one-shot can carry its position in the series.
  const body =
    entry.kind === TRIGGER_KIND.ONCE && entry.total > 1
      ? `${target} (${entry.index + 1} of ${entry.total})`
      : target;
  return {
    id: entry.id,
    title: 'Scheduled payment ready',
    body,
    data: {
      type: SCHEDULED_PAYMENT_NOTIFICATION_TYPE,
      scheduledPaymentId: entry.paymentId,
      walletClientId: entry.walletClientId ?? '',
    },
    android: {
      channelId: SCHEDULED_PAYMENT_CHANNEL_ID,
      pressAction: {id: 'default'},
    },
    ios: {
      sound: 'default',
    },
  };
};

const buildTrigger = entry => ({
  type: TriggerType.TIMESTAMP,
  timestamp: entry.timestamp,
  ...(entry.kind === TRIGGER_KIND.REPEAT
    ? {repeatFrequency: REPEAT_FREQUENCY_BY_REPEAT[entry.repeat]}
    : {}),
});

/**
 * Make the OS's pending trigger notifications match what the payments in
 * redux (plus `include`) call for: create what is missing, cancel what is
 * stale, leave the rest alone. Idempotent, so it runs on app start,
 * foreground, list focus, after every create / edit / delete / prune and
 * when a reminder is delivered — any of which can change the desired set
 * (a fired one-shot frees a slot, a repeat run may need to hand over to its
 * final one-shot, a far-future run may now be within range of a repeat).
 * Returns how many triggers the plan holds for `include`.
 */
export const reconcileScheduledPaymentNotifications = async (
  getState,
  {include} = {},
) => {
  const payments = collectPaymentsForReminders(getState(), {include});
  const plan = applyTriggerLimit(
    planScheduledPaymentTriggers({payments}),
    MAX_PENDING_TRIGGER_NOTIFICATIONS,
  );
  const entries = [...plan.repeats, ...plan.onces];
  const pendingIds = (await notifee.getTriggerNotificationIds()).filter(
    parseTriggerId,
  );
  const {toCreate, toCancel} = diffTriggerIds(
    entries.map(entry => entry.id),
    pendingIds,
  );
  const toCreateSet = new Set(toCreate);
  if (toCreate.length) {
    await ensureAndroidChannel();
  }
  await Promise.all([
    ...entries
      .filter(entry => toCreateSet.has(entry.id))
      .map(entry =>
        notifee.createTriggerNotification(
          buildTriggerNotification(entry),
          buildTrigger(entry),
        ),
      ),
    ...toCancel.map(id => notifee.cancelNotification(id)),
  ]);
  return {
    armedForInclude: include?.id
      ? entries.filter(entry => entry.paymentId === include.id).length
      : 0,
    cancelled: toCancel.length,
  };
};

/**
 * Called by submitScheduledPayment before the payment is persisted. Refuses
 * (without touching the OS) when the payment would push the app past the
 * platform's pending-notification limit, then requires permission, then
 * reconciles with the payment included.
 */
export const createScheduledPaymentNotification = async (payment, getState) => {
  if (!payment?.id) {
    return {scheduled: false, blocked: false};
  }
  const state = getState();
  // In edit mode the payment's current reminders are being replaced, so
  // they don't count against it.
  const {used: existing, limit} = getReminderSlotUsage(state, {
    excludeId: payment.id,
  });
  const total = countTriggersForPayments(
    collectPaymentsForReminders(state, {include: payment}),
  );
  const required = total - existing;
  if (required <= 0) {
    // Nothing left to remind about (every occurrence is in the past, or the
    // wallet suppresses reminders).
    return {scheduled: false, blocked: false};
  }
  if (total > limit) {
    return {
      scheduled: false,
      blocked: false,
      limitExceeded: {existing, required, limit},
    };
  }
  const {granted, blocked} = await requestLocalNotificationPermission();
  if (!granted) {
    return {scheduled: false, blocked};
  }
  try {
    const {armedForInclude} = await reconcileScheduledPaymentNotifications(
      getState,
      {include: payment},
    );
    return {scheduled: armedForInclude > 0, blocked: false};
  } catch (e) {
    console.warn('Failed to schedule local payment notification', e);
    return {scheduled: false, blocked: false};
  }
};
