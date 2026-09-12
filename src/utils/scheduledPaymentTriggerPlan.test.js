import dayjs from 'dayjs';
import {MAX_OCCURRENCES, REPEAT_TYPE, CUSTOM_UNIT} from './scheduleRecurrence';
import {
  TRIGGER_KIND,
  TRIGGER_REPEAT,
  TRANSITIONAL_ONCE_COUNT,
  buildOnceTriggerId,
  buildRepeatTriggerId,
  parseTriggerId,
  planScheduledPaymentTriggers,
  applyTriggerLimit,
  diffTriggerIds,
  countTriggersForPayments,
  countTriggersByPayment,
} from './scheduledPaymentTriggerPlan';

const DAY = 24 * 60 * 60 * 1000;
// Fri 11 Sep 2026 16:23 local — the report's timeline.
const NOW = dayjs('2026-09-11T16:23:00').valueOf();
const START = dayjs('2026-09-11T15:24:00').valueOf(); // already fired today

const payment = (id, overrides) => ({
  id,
  walletClientId: 'w1',
  scheduledAt: START,
  recurrence: {type: REPEAT_TYPE.NONE},
  ...overrides,
});

const monWedFri = payment('mwf', {
  recurrence: {type: REPEAT_TYPE.WEEKLY, interval: 1, weeklyDays: [1, 3, 5]},
});
const daily = payment('d', {
  recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
});
const monthly = payment('m', {
  scheduledAt: NOW + DAY,
  recurrence: {type: REPEAT_TYPE.MONTHLY, interval: 1},
});

describe('trigger ids', () => {
  it('round-trips once and repeat ids and rejects foreign ids', () => {
    expect(parseTriggerId(buildOnceTriggerId('abc', 7))).toEqual({
      paymentId: 'abc',
      kind: TRIGGER_KIND.ONCE,
      index: 7,
    });
    expect(parseTriggerId(buildRepeatTriggerId('abc', '3'))).toEqual({
      paymentId: 'abc',
      kind: TRIGGER_KIND.REPEAT,
      key: '3',
    });
    expect(parseTriggerId(buildRepeatTriggerId('abc', 'd')).key).toBe('d');
    expect(parseTriggerId('onesignal-123')).toBeNull();
    expect(parseTriggerId('abc::x')).toBeNull();
    expect(parseTriggerId(null)).toBeNull();
  });
});

describe('planScheduledPaymentTriggers', () => {
  it('turns a started Mon/Wed/Fri series into three weekly repeats', () => {
    const plan = planScheduledPaymentTriggers({
      payments: [monWedFri],
      now: NOW,
    });
    expect(plan.onces).toHaveLength(0);
    expect(plan.repeats.map(r => r.id).sort()).toEqual(
      ['mwf::r1', 'mwf::r3', 'mwf::r5'].sort(),
    );
    const byKey = Object.fromEntries(plan.repeats.map(r => [r.key, r]));
    expect(dayjs(byKey['1'].timestamp).format('YYYY-MM-DD HH:mm')).toBe(
      '2026-09-14 15:24',
    );
    expect(dayjs(byKey['3'].timestamp).format('YYYY-MM-DD HH:mm')).toBe(
      '2026-09-16 15:24',
    );
    expect(dayjs(byKey['5'].timestamp).format('YYYY-MM-DD HH:mm')).toBe(
      '2026-09-18 15:24',
    );
    expect(byKey['1'].repeat).toBe(TRIGGER_REPEAT.WEEKLY);
    expect(plan.total).toBe(3);
  });

  it('turns a started daily series into one daily repeat', () => {
    const plan = planScheduledPaymentTriggers({payments: [daily], now: NOW});
    expect(plan.repeats).toHaveLength(1);
    expect(plan.repeats[0]).toMatchObject({
      id: 'd::rd',
      key: 'd',
      repeat: TRIGGER_REPEAT.DAILY,
      paymentId: 'd',
      walletClientId: 'w1',
    });
    expect(dayjs(plan.repeats[0].timestamp).format('YYYY-MM-DD HH:mm')).toBe(
      '2026-09-12 15:24',
    );
    expect(plan.onces).toHaveLength(0);
  });

  it('arms a far-future daily start as a few one-shots, then switches to a repeat', () => {
    const later = payment('d2', {
      scheduledAt: NOW + 3 * DAY,
      recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
    });
    const before = planScheduledPaymentTriggers({payments: [later], now: NOW});
    expect(before.repeats).toHaveLength(0);
    expect(before.onces.map(o => o.id)).toEqual(
      Array.from({length: TRANSITIONAL_ONCE_COUNT}, (_, i) => `d2::${i}`),
    );
    expect(before.total).toBe(TRANSITIONAL_ONCE_COUNT);

    const after = planScheduledPaymentTriggers({
      payments: [later],
      now: NOW + 2.5 * DAY,
    });
    expect(after.repeats.map(r => r.id)).toEqual(['d2::rd']);
    expect(after.onces).toHaveLength(0);
  });

  it('hands a far-future run over from its one-shots to a repeat on the next sync', () => {
    // The first one-shot fired and the app was never opened, so the OS still
    // holds the remaining pre-armed one-shots. A sync now (next occurrence
    // within a day) wants the repeat instead and cancels them.
    const later = payment('d2', {
      scheduledAt: NOW + 3 * DAY,
      recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
    });
    const plan = planScheduledPaymentTriggers({
      payments: [later],
      now: NOW + 3.5 * DAY,
    });
    expect(plan.repeats.map(r => r.id)).toEqual(['d2::rd']);
    expect(plan.onces).toHaveLength(0);
    const stillPending = ['d2::1', 'd2::2'];
    expect(
      diffTriggerIds(
        plan.repeats.map(r => r.id),
        stillPending,
      ),
    ).toEqual({toCreate: ['d2::rd'], toCancel: stillPending});
  });

  it('uses a one-shot for the final occurrence of a repeating rule', () => {
    // 29 of 30 daily occurrences have passed (index 28 fired today).
    const almostDone = payment('d3', {
      scheduledAt: START - 28 * DAY,
      recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
    });
    const plan = planScheduledPaymentTriggers({
      payments: [almostDone],
      now: NOW,
    });
    expect(plan.repeats).toHaveLength(0);
    expect(plan.onces).toHaveLength(1);
    expect(plan.onces[0]).toMatchObject({
      id: 'd3::29',
      index: 29,
      total: MAX_OCCURRENCES,
    });
  });

  it('emits one-shots with absolute indices for non-repeatable rules', () => {
    const everyTwoDays = payment('c', {
      scheduledAt: START - 4 * DAY, // indices 0,1,2 have passed
      recurrence: {
        type: REPEAT_TYPE.CUSTOM,
        interval: 2,
        unit: CUSTOM_UNIT.DAY,
      },
    });
    const plan = planScheduledPaymentTriggers({
      payments: [everyTwoDays],
      now: NOW,
    });
    expect(plan.repeats).toHaveLength(0);
    expect(plan.onces[0]).toMatchObject({id: 'c::3', index: 3});
    expect(plan.onces).toHaveLength(MAX_OCCURRENCES - 3);
    expect(plan.onces.map(o => o.timestamp)).toEqual(
      [...plan.onces.map(o => o.timestamp)].sort((a, b) => a - b),
    );
  });

  it('skips expired payments and adds walletClientId to every entry', () => {
    const expired = payment('x', {scheduledAt: START});
    const plan = planScheduledPaymentTriggers({
      payments: [expired, monthly],
      now: NOW,
    });
    expect(plan.onces.every(o => o.paymentId === 'm')).toBe(true);
    expect(plan.onces.every(o => o.walletClientId === 'w1')).toBe(true);
  });

  it('counts the cost across payments', () => {
    expect(countTriggersForPayments([daily, monWedFri, monthly], NOW)).toBe(
      1 + 3 + MAX_OCCURRENCES,
    );
  });

  it('counts the cost per payment', () => {
    const counts = countTriggersByPayment([daily, monWedFri, monthly], NOW);
    expect(Object.fromEntries(counts)).toEqual({
      d: 1,
      mwf: 3,
      m: MAX_OCCURRENCES,
    });
  });
});

describe('applyTriggerLimit', () => {
  it('keeps repeats and drops the latest-firing one-shots beyond the limit', () => {
    const plan = planScheduledPaymentTriggers({
      payments: [daily, monthly],
      now: NOW,
    });
    const capped = applyTriggerLimit(plan, 10);
    expect(capped.repeats).toHaveLength(1);
    expect(capped.onces).toHaveLength(9);
    expect(capped.onces.map(o => o.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('caps repeats too when they alone exceed the limit', () => {
    const plan = planScheduledPaymentTriggers({
      payments: [daily, monWedFri, monthly],
      now: NOW,
    });
    expect(plan.repeats).toHaveLength(4);
    const capped = applyTriggerLimit(plan, 2);
    expect(capped.repeats).toEqual(plan.repeats.slice(0, 2));
    expect(capped.onces).toHaveLength(0);
    expect(capped.total).toBe(2);
    expect(applyTriggerLimit(plan, 0)).toEqual({
      repeats: [],
      onces: [],
      total: 0,
    });
  });

  it('is a no-op under the limit', () => {
    const plan = planScheduledPaymentTriggers({payments: [daily], now: NOW});
    expect(applyTriggerLimit(plan, 64)).toEqual(plan);
  });
});

describe('diffTriggerIds', () => {
  it('splits into missing and stale', () => {
    expect(
      diffTriggerIds(['a::1', 'a::2', 'b::rd'], ['a::2', 'a::3', 'zzz::r4']),
    ).toEqual({toCreate: ['a::1', 'b::rd'], toCancel: ['a::3', 'zzz::r4']});
  });
});
