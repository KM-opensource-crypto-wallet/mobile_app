import dayjs from 'dayjs';

export const REPEAT_TYPE = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
};

export const CUSTOM_UNIT = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

export const WEEKDAYS = [
  {value: 0, short: 'S', label: 'Sunday'},
  {value: 1, short: 'M', label: 'Monday'},
  {value: 2, short: 'T', label: 'Tuesday'},
  {value: 3, short: 'W', label: 'Wednesday'},
  {value: 4, short: 'T', label: 'Thursday'},
  {value: 5, short: 'F', label: 'Friday'},
  {value: 6, short: 'S', label: 'Saturday'},
];

// iOS caps pending local notifications at ~64 app-wide, so each scheduled
// payment must stay well under that even if it repeats "forever".
export const MAX_OCCURRENCES = 24;

const REPEAT_UNIT_BY_TYPE = {
  [REPEAT_TYPE.DAILY]: 'day',
  [REPEAT_TYPE.WEEKLY]: 'week',
  [REPEAT_TYPE.MONTHLY]: 'month',
  [REPEAT_TYPE.YEARLY]: 'year',
};

const getRepeatUnit = recurrence => {
  if (recurrence?.type === REPEAT_TYPE.CUSTOM) {
    return recurrence?.unit || CUSTOM_UNIT.DAY;
  }
  return REPEAT_UNIT_BY_TYPE[recurrence?.type];
};

// Returns every occurrence timestamp (ms) for a recurrence rule, starting
// at scheduledAt and running up to MAX_OCCURRENCES. There's no user-facing
// end condition — the user stops a series early by deleting it.
export const computeOccurrences = ({scheduledAt, recurrence}) => {
  const start = Number(scheduledAt);
  if (!start || !Number.isFinite(start)) {
    return [];
  }
  if (!recurrence || recurrence.type === REPEAT_TYPE.NONE) {
    return [start];
  }

  const interval = Math.max(1, parseInt(recurrence.interval, 10) || 1);
  const unit = getRepeatUnit(recurrence);

  const weeklyDays =
    recurrence.type === REPEAT_TYPE.WEEKLY &&
    Array.isArray(recurrence.weeklyDays) &&
    recurrence.weeklyDays.length
      ? [...new Set(recurrence.weeklyDays)].sort((a, b) => a - b)
      : null;

  const occurrences = [];

  if (weeklyDays) {
    const anchorWeekStart = dayjs(start).startOf('week');
    const startTime = dayjs(start);
    let cursor = startTime.startOf('day');
    // Secondary bound so the day-by-day walk can't spin forever.
    const walkLimit = cursor.add(2, 'year');
    while (occurrences.length < MAX_OCCURRENCES && cursor.isBefore(walkLimit)) {
      const weeksSinceAnchor = cursor
        .startOf('week')
        .diff(anchorWeekStart, 'week');
      if (
        weeksSinceAnchor >= 0 &&
        weeksSinceAnchor % interval === 0 &&
        weeklyDays.includes(cursor.day())
      ) {
        const candidate = cursor.isSame(startTime, 'day')
          ? start
          : cursor
              .hour(startTime.hour())
              .minute(startTime.minute())
              .second(0)
              .millisecond(0)
              .valueOf();
        if (candidate >= start) {
          occurrences.push(candidate);
        }
      }
      cursor = cursor.add(1, 'day');
    }
    return occurrences;
  }

  let candidate = start;
  while (occurrences.length < MAX_OCCURRENCES) {
    occurrences.push(candidate);
    candidate = dayjs(candidate).add(interval, unit).valueOf();
  }
  return occurrences;
};

export const describeRecurrence = recurrence => {
  if (!recurrence || recurrence.type === REPEAT_TYPE.NONE) {
    return null;
  }
  const interval = Math.max(1, parseInt(recurrence.interval, 10) || 1);
  let base;
  switch (recurrence.type) {
    case REPEAT_TYPE.DAILY:
      base =
        interval === 1 ? 'Repeats daily' : `Repeats every ${interval} days`;
      break;
    case REPEAT_TYPE.WEEKLY: {
      const days =
        Array.isArray(recurrence.weeklyDays) && recurrence.weeklyDays.length
          ? recurrence.weeklyDays
              .slice()
              .sort((a, b) => a - b)
              .map(d => WEEKDAYS[d]?.label?.slice(0, 3))
              .join(', ')
          : null;
      const weeklyBase =
        interval === 1 ? 'Repeats weekly' : `Repeats every ${interval} weeks`;
      base = days ? `${weeklyBase} on ${days}` : weeklyBase;
      break;
    }
    case REPEAT_TYPE.MONTHLY:
      base =
        interval === 1 ? 'Repeats monthly' : `Repeats every ${interval} months`;
      break;
    case REPEAT_TYPE.YEARLY:
      base =
        interval === 1 ? 'Repeats yearly' : `Repeats every ${interval} years`;
      break;
    case REPEAT_TYPE.CUSTOM: {
      const unit = recurrence.unit || CUSTOM_UNIT.DAY;
      base = `Repeats every ${interval} ${unit}${interval === 1 ? '' : 's'}`;
      break;
    }
    default:
      base = 'Repeats';
  }
  return base;
};
