import dayjs from 'dayjs';
import {
  REPEAT_TYPE,
  MAX_OCCURRENCES,
  SCHEDULED_PAYMENT_STALE_AFTER_MS,
  getLastOccurrence,
  getNextOccurrence,
  isScheduledPaymentExpired,
  isScheduledPaymentStale,
} from './scheduleRecurrence';

const NOW = dayjs('2026-09-11T10:00:00').valueOf();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('getNextOccurrence', () => {
  it('returns the start itself for a future one-time payment', () => {
    const payment = {
      scheduledAt: NOW + HOUR,
      recurrence: {type: REPEAT_TYPE.NONE},
    };
    expect(getNextOccurrence(payment, NOW)).toEqual({
      timestamp: NOW + HOUR,
      index: 0,
      total: 1,
    });
  });

  it('returns null for a past one-time payment', () => {
    const payment = {
      scheduledAt: NOW - HOUR,
      recurrence: {type: REPEAT_TYPE.NONE},
    };
    expect(getNextOccurrence(payment, NOW)).toBeNull();
  });

  it('treats a missing recurrence as one-time', () => {
    expect(getNextOccurrence({scheduledAt: NOW - 1}, NOW)).toBeNull();
    expect(getNextOccurrence({scheduledAt: NOW + 1}, NOW)?.timestamp).toBe(
      NOW + 1,
    );
  });

  it('skips past occurrences of a recurring payment and reports the index', () => {
    const start = NOW - 2 * DAY - HOUR; // fired 3 times already (day -2, -1, 0 at 09:00)
    const payment = {
      scheduledAt: start,
      recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
    };
    const next = getNextOccurrence(payment, NOW);
    expect(next.index).toBe(3);
    expect(next.total).toBe(MAX_OCCURRENCES);
    expect(dayjs(next.timestamp).format('YYYY-MM-DD HH:mm')).toBe(
      '2026-09-12 09:00',
    );
  });

  it('returns an occurrence exactly at now (not yet missed)', () => {
    const payment = {scheduledAt: NOW, recurrence: {type: REPEAT_TYPE.NONE}};
    expect(getNextOccurrence(payment, NOW)?.timestamp).toBe(NOW);
  });

  it('returns null once a recurring series is exhausted', () => {
    const start = NOW - (MAX_OCCURRENCES + 1) * DAY;
    const payment = {
      scheduledAt: start,
      recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
    };
    expect(getNextOccurrence(payment, NOW)).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(getNextOccurrence(null, NOW)).toBeNull();
    expect(getNextOccurrence({scheduledAt: 'abc'}, NOW)).toBeNull();
  });
});

describe('isScheduledPaymentExpired', () => {
  it('is false while a future occurrence exists', () => {
    expect(
      isScheduledPaymentExpired(
        {
          scheduledAt: NOW - DAY,
          recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
        },
        NOW,
      ),
    ).toBe(false);
  });

  it('is true for a past one-time payment', () => {
    expect(
      isScheduledPaymentExpired(
        {scheduledAt: NOW - 1, recurrence: {type: REPEAT_TYPE.NONE}},
        NOW,
      ),
    ).toBe(true);
  });

  it('is true for an exhausted recurring series', () => {
    expect(
      isScheduledPaymentExpired(
        {
          scheduledAt: NOW - (MAX_OCCURRENCES + 1) * DAY,
          recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
        },
        NOW,
      ),
    ).toBe(true);
  });

  it('is true for a payment with no valid scheduledAt', () => {
    expect(isScheduledPaymentExpired({}, NOW)).toBe(true);
  });
});

describe('getLastOccurrence', () => {
  it('is the scheduled time itself for a one-time payment', () => {
    expect(
      getLastOccurrence({
        scheduledAt: NOW,
        recurrence: {type: REPEAT_TYPE.NONE},
      }),
    ).toBe(NOW);
  });

  it('is the final occurrence of a recurring series', () => {
    expect(
      getLastOccurrence({
        scheduledAt: NOW,
        recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
      }),
    ).toBe(
      dayjs(NOW)
        .add(MAX_OCCURRENCES - 1, 'day')
        .valueOf(),
    );
  });

  it('is null when there is no computable occurrence', () => {
    expect(getLastOccurrence({})).toBeNull();
    expect(getLastOccurrence(null)).toBeNull();
  });
});

describe('isScheduledPaymentStale', () => {
  const oneTimeAt = scheduledAt => ({
    scheduledAt,
    recurrence: {type: REPEAT_TYPE.NONE},
  });

  // The regression this whole guard exists for: a reminder fires, the payment
  // is instantly "expired", and a prune moments later used to delete it out
  // from under the notification still waiting to be tapped.
  it('is false for a payment whose reminder just fired', () => {
    const payment = oneTimeAt(NOW - 60 * 1000);
    expect(isScheduledPaymentExpired(payment, NOW)).toBe(true);
    expect(isScheduledPaymentStale(payment, NOW)).toBe(false);
  });

  it('is false right up to the staleness cutoff', () => {
    expect(
      isScheduledPaymentStale(
        oneTimeAt(NOW - SCHEDULED_PAYMENT_STALE_AFTER_MS),
        NOW,
      ),
    ).toBe(false);
  });

  it('is true once the cutoff is passed', () => {
    expect(
      isScheduledPaymentStale(
        oneTimeAt(NOW - SCHEDULED_PAYMENT_STALE_AFTER_MS - 1),
        NOW,
      ),
    ).toBe(true);
  });

  it('is false for an upcoming payment', () => {
    expect(isScheduledPaymentStale(oneTimeAt(NOW + DAY), NOW)).toBe(false);
  });

  it('is false for a recurring series mid-run', () => {
    expect(
      isScheduledPaymentStale(
        {
          scheduledAt: NOW - DAY,
          recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
        },
        NOW,
      ),
    ).toBe(false);
  });

  it('follows an exhausted series from its last occurrence, not its first', () => {
    const ranOutAt = NOW - DAY;
    const payment = {
      scheduledAt: ranOutAt - (MAX_OCCURRENCES - 1) * DAY,
      recurrence: {type: REPEAT_TYPE.DAILY, interval: 1},
    };
    expect(isScheduledPaymentExpired(payment, NOW)).toBe(true);
    expect(isScheduledPaymentStale(payment, NOW)).toBe(false);
    expect(
      isScheduledPaymentStale(
        payment,
        ranOutAt + SCHEDULED_PAYMENT_STALE_AFTER_MS + 1,
      ),
    ).toBe(true);
  });

  it('is true for a payment with no valid scheduledAt', () => {
    expect(isScheduledPaymentStale({}, NOW)).toBe(true);
  });
});
