// Formatting helpers shared by the exchange history list and details screens.

export const EXCHANGE_STATUS_CONFIG = {
  pending: {label: 'Pending', color: '#D97706'},
  completed: {label: 'Completed', color: '#16A34A'},
  failed: {label: 'Failed', color: '#DC2626'},
  expired: {label: 'Expired', color: '#6B7280'},
  refunded: {label: 'Refunded', color: '#2563EB'},
};

export const TERMINAL_EXCHANGE_STATUSES = [
  'completed',
  'failed',
  'expired',
  'refunded',
];

export const truncateExchangeAmount = amount => {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return '';
  }
  if (num === 0) {
    return '0';
  }
  const abs = Math.abs(num);
  if (abs < 0.000001) {
    return num.toExponential(2);
  }
  if (abs < 1) {
    return parseFloat(num.toFixed(6)).toString();
  }
  if (abs < 1000) {
    return parseFloat(num.toFixed(4)).toString();
  }
  return parseFloat(num.toFixed(2)).toString();
};

export const exchangePairLabel = transaction =>
  `${transaction?.from_currency?.toUpperCase() || '—'} → ${
    transaction?.to_currency?.toUpperCase() || '—'
  }`;
