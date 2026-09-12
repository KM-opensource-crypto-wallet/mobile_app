import dayjs from 'dayjs';
import {
  REPEAT_TYPE,
  MAX_OCCURRENCES,
  getNextOccurrence,
  isScheduledPaymentExpired,
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
