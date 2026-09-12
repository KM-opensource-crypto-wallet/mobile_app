import dayjs from 'dayjs';
import {REPEAT_TYPE, computeOccurrences} from 'utils/scheduleRecurrence';

/**
 * Pure planning of which notifee trigger notifications should exist for a
 * set of scheduled payments. No notifee / react-native imports so it can be
 * unit-tested under node; utils/scheduledPaymentNotifications.js turns the
 * plan into real notifications.
 *
 * Two kinds of trigger:
 * - "repeat": one native repeating trigger (notifee repeatFrequency DAILY /
 *   WEEKLY) standing in for a whole run of occurrences. Costs a single
 *   pending-notification slot however many times it fires.
 * - "once": one trigger per occurrence, for rules the OS can't repeat.
 *
 * Ids encode payment + occurrence so a later plan can be diffed against
 * what the OS still holds: `${paymentId}::${index}` for once,
 * `${paymentId}::r${key}` for repeat (key 'd' = daily, '0'-'6' = weekday).
 */

export const TRIGGER_KIND = {ONCE: 'once', REPEAT: 'repeat'};
export const TRIGGER_REPEAT = {DAILY: 'daily', WEEKLY: 'weekly'};

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_MS = {
  [TRIGGER_REPEAT.DAILY]: DAY_MS,
  [TRIGGER_REPEAT.WEEKLY]: 7 * DAY_MS,
};
const DAILY_KEY = 'd';
const ID_SEPARATOR = '::';
const TRIGGER_ID_PATTERN = /^(.+)::(?:r(d|[0-6])|(\d+))$/;

export const buildOnceTriggerId = (paymentId, index) =>
  `${paymentId}${ID_SEPARATOR}${index}`;

export const buildRepeatTriggerId = (paymentId, key) =>
  `${paymentId}${ID_SEPARATOR}r${key}`;

// null for anything this feature didn't create, so foreign notifications
// are never cancelled by a reconcile.
export const parseTriggerId = id => {
  const match = typeof id === 'string' ? id.match(TRIGGER_ID_PATTERN) : null;
  if (!match) {
    return null;
  }
  const [, paymentId, repeatKey, onceIndex] = match;
  return repeatKey !== undefined
    ? {paymentId, kind: TRIGGER_KIND.REPEAT, key: repeatKey}
    : {paymentId, kind: TRIGGER_KIND.ONCE, index: Number(onceIndex)};
};

const getInterval = recurrence =>
  Math.max(1, parseInt(recurrence?.interval, 10) || 1);

// Which native repeat, if any, can stand in for this rule.
const getNativeRepeat = recurrence => {
  if (getInterval(recurrence) !== 1) {
    return null;
  }
  if (recurrence?.type === REPEAT_TYPE.DAILY) {
    return TRIGGER_REPEAT.DAILY;
  }
  if (recurrence?.type === REPEAT_TYPE.WEEKLY) {
    return TRIGGER_REPEAT.WEEKLY;
  }
  return null;
};

// A daily rule is one run; a weekly rule is one run per weekday, because
// iOS's weekly trigger is "this weekday at this time".
const groupIntoRuns = (occurrences, repeat) => {
  if (repeat === TRIGGER_REPEAT.DAILY) {
    return [{key: DAILY_KEY, occurrences}];
  }
  const byWeekday = new Map();
  occurrences.forEach(occurrence => {
    const weekday = String(dayjs(occurrence.timestamp).day());
    if (!byWeekday.has(weekday)) {
      byWeekday.set(weekday, []);
    }
    byWeekday.get(weekday).push(occurrence);
  });
  return [...byWeekday.entries()].map(([key, list]) => ({
    key,
    occurrences: list,
  }));
};

const toOnceEntry = (payment, occurrence) => ({
  kind: TRIGGER_KIND.ONCE,
  id: buildOnceTriggerId(payment.id, occurrence.index),
  paymentId: payment.id,
  walletClientId: payment.walletClientId,
  timestamp: occurrence.timestamp,
  index: occurrence.index,
  total: occurrence.total,
  payment,
});

const toRepeatEntry = (payment, run, repeat) => ({
  kind: TRIGGER_KIND.REPEAT,
  id: buildRepeatTriggerId(payment.id, run.key),
  key: run.key,
  repeat,
  paymentId: payment.id,
  walletClientId: payment.walletClientId,
  timestamp: run.occurrences[0].timestamp,
  payment,
});

const planPayment = (payment, now) => {
  const future = computeOccurrences({
    scheduledAt: payment?.scheduledAt,
    recurrence: payment?.recurrence,
  })
    .map((timestamp, index, all) => ({timestamp, index, total: all.length}))
    .filter(occurrence => occurrence.timestamp > now);
  if (!payment?.id || !future.length) {
    return {repeats: [], onces: []};
  }

  const repeat = getNativeRepeat(payment.recurrence);
  if (!repeat) {
    return {repeats: [], onces: future.map(o => toOnceEntry(payment, o))};
  }

  const repeats = [];
  const onces = [];
  groupIntoRuns(future, repeat).forEach(run => {
    const [first] = run.occurrences;
    // A native repeat is only right when it would fire at exactly the run's
    // next occurrence and there is more than one occurrence left:
    // - iOS ignores a repeating trigger's start date (daily: time of day
    //   only; weekly: weekday + time), so a run whose next occurrence is
    //   more than one period away would fire early. Until then only that
    //   next occurrence is armed, as a one-shot; a later sync (the app is
    //   opened, or that reminder is delivered) switches the run to a repeat.
    // - A repeat never stops on its own, so the final occurrence is a
    //   one-shot; the run's repeat is cancelled by the same sync.
    // Either way a run costs exactly one pending-notification slot.
    const withinOnePeriod = first.timestamp - now <= PERIOD_MS[repeat];
    if (withinOnePeriod && run.occurrences.length > 1) {
      repeats.push(toRepeatEntry(payment, run, repeat));
    } else {
      onces.push(toOnceEntry(payment, first));
    }
  });
  return {repeats, onces};
};

/**
 * Every trigger that should exist for `payments` (each carrying its
 * walletClientId) as of `now`. Not capped — see applyTriggerLimit. `total`
 * is the number of pending-notification slots the plan needs.
 */
export const planScheduledPaymentTriggers = ({payments, now = Date.now()}) => {
  const repeats = [];
  const onces = [];
  (Array.isArray(payments) ? payments : []).forEach(payment => {
    const planned = planPayment(payment, now);
    repeats.push(...planned.repeats);
    onces.push(...planned.onces);
  });
  onces.sort((a, b) => a.timestamp - b.timestamp);
  return {repeats, onces, total: repeats.length + onces.length};
};

export const countTriggersForPayments = (payments, now = Date.now()) =>
  planScheduledPaymentTriggers({payments, now}).total;

// Pending-notification slots each payment occupies right now, keyed by
// payment id — what the list shows so the user can see which payment to
// delete when the device limit is hit.
export const countTriggersByPayment = (payments, now = Date.now()) => {
  const {repeats, onces} = planScheduledPaymentTriggers({payments, now});
  const counts = new Map();
  [...repeats, ...onces].forEach(entry => {
    counts.set(entry.paymentId, (counts.get(entry.paymentId) || 0) + 1);
  });
  return counts;
};

// Last-resort guard so a reconcile can never ask the OS for more than it
// holds (e.g. payments persisted before the limit check existed). Repeats
// are always kept — each is a whole run — and the latest-firing one-shots go
// first. Creation is refused up front when a new payment would cross the
// limit, so in normal operation this is a no-op.
export const applyTriggerLimit = (plan, limit) => {
  if (plan.total <= limit) {
    return plan;
  }
  const onces = plan.onces.slice(0, Math.max(0, limit - plan.repeats.length));
  return {
    repeats: plan.repeats,
    onces,
    total: plan.repeats.length + onces.length,
  };
};

export const diffTriggerIds = (desiredIds, pendingIds) => {
  const desired = new Set(desiredIds);
  const pending = new Set(pendingIds);
  return {
    toCreate: desiredIds.filter(id => !pending.has(id)),
    toCancel: pendingIds.filter(id => !desired.has(id)),
  };
};
