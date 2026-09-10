import {HEDERA_KEY_MISMATCH_MESSAGE} from 'dok-wallet-blockchain-networks/helper';

// Exceptions that are expected behaviour, not defects. They are still visible
// as `*/rejected` breadcrumbs and `dokapi.failed` logs; only the issue is
// suppressed. Keep this list short and grow it from real dashboard noise.
export const ignoreErrors = [
  // Connectivity: axios / fetch / WalletConnect relay.
  'Network Error',
  'Network request failed',
  /^timeout of \d+ms exceeded/,
  /Request failed with status code/,
  /No matching key/,
  /Socket stalled/,
  /WebSocket connection (closed|failed)/i,
  /pairing topic .* expired/i,
  // User choices and business rules thrown as errors by our own code.
  'transaction was cancelled',
  'User rejected.',
  'Invalid Custom Address',
  'polkadot_receiver_should_1_dot',
  HEDERA_KEY_MISMATCH_MESSAGE,
  /insufficient funds/i,
  /Insufficient token balance/i,
  // rpcUrls.js throttles itself by throwing.
  'last call made with 10 minutes',
];
