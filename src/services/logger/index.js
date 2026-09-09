// Error reporting and logs (Sentry). This is the only module the rest of the
// app should import for observability; call sites never touch `@sentry/*`.
//
// What is captured:
//   - uncaught JS errors + unhandled rejections (SDK default handlers)
//   - native crashes (SDK default)
//   - every console.* call as a Sentry Log (Console Logging integration; this
//     is the Bugfender behaviour the team relies on)
//   - structured `logger.*` calls, `captureError`, `addBreadcrumb` from a small
//     number of chokepoints (send, wallet create/import, WalletConnect, DokApi,
//     rejected thunks, navigation, lifecycle, toasts)
//
// What never leaves the device: mnemonics, private keys, passwords, request
// bodies/headers. `scrub.js` enforces this in beforeSend / beforeBreadcrumb /
// beforeSendLog, and call sites must still not pass addresses or amounts.
import * as Sentry from '@sentry/react-native';
import {IS_SANDBOX} from 'dok-wallet-blockchain-networks/config/config';
import {scrubObject, scrubString, stripQuery} from './scrub';
import {ignoreErrors} from './ignoreErrors';

const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;
const ENABLE_IN_DEV = process.env.SENTRY_ENABLE_IN_DEV === 'true';
// Attributes support wants `tx_hash` searchable; it is public chain data.
const EVENT_ALLOW_KEYS = ['tx_hash'];
// Console breadcrumbs are context for an error, not the log stream; the full
// stream is in Logs. Dropping `log`/`debug` keeps the 50-entry ring useful.
const CONSOLE_BREADCRUMB_LEVELS = new Set([
  'info',
  'warning',
  'error',
  'fatal',
]);

export const isSentryEnabled = () => !IS_DEV || ENABLE_IN_DEV;

const safeStringify = value => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
};

// Prints to Metro/Xcode/logcat without being re-captured as a Sentry log.
const devPrint = (method, ...args) => {
  if (!IS_DEV) {
    return;
  }
  Sentry.consoleSandbox(() => {
    (console[method] || console.log)(...args);
  });
};

// Sentry log attributes must be primitives; flatten objects to scrubbed JSON.
const compact = attrs => {
  if (!attrs || typeof attrs !== 'object') {
    return undefined;
  }
  const out = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) {
      continue;
    }
    out[key] =
      typeof value === 'object' ? scrubString(safeStringify(value)) : value;
  }
  return out;
};

const beforeSend = event => {
  if (event.message) {
    event.message = scrubString(event.message);
  }
  if (event.exception?.values) {
    event.exception.values.forEach(exception => {
      if (exception.value) {
        exception.value = scrubString(exception.value);
      }
    });
  }
  if (event.extra) {
    event.extra = scrubObject(event.extra, {allowKeys: EVENT_ALLOW_KEYS});
  }
  if (event.tags) {
    event.tags = scrubObject(event.tags, {allowKeys: EVENT_ALLOW_KEYS});
  }
  if (event.user) {
    event.user = event.user.id ? {id: event.user.id} : undefined;
  }
  delete event.request;
  return event;
};

const beforeBreadcrumb = breadcrumb => {
  if (
    breadcrumb.category === 'console' &&
    !CONSOLE_BREADCRUMB_LEVELS.has(breadcrumb.level)
  ) {
    return null;
  }
  if (breadcrumb.message) {
    breadcrumb.message = scrubString(breadcrumb.message);
  }
  if (breadcrumb.data) {
    breadcrumb.data = scrubObject(breadcrumb.data, {
      allowKeys: EVENT_ALLOW_KEYS,
    });
  }
  return breadcrumb;
};

const beforeSendLog = log => {
  if (log.message) {
    log.message = scrubString(log.message);
  }
  if (log.attributes) {
    log.attributes = scrubObject(log.attributes, {allowKeys: EVENT_ALLOW_KEYS});
  }
  return log;
};

export const initSentry = () => {
  // Resolved here rather than at import time: this module is imported by redux
  // slices, and wlData pulls in variant assets that only exist in the app.
  const {SENTRY_DSN, wlName} = require('utils/wlData');
  if (!SENTRY_DSN) {
    devPrint('warn', `[sentry] no DSN configured for variant "${wlName}"`);
    return;
  }
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: isSentryEnabled(),
    // SDK internals (envelope sends, dropped events) in Metro; dev only.
    debug: IS_DEV && process.env.SENTRY_DEBUG === 'true',
    environment: IS_DEV ? 'development' : IS_SANDBOX ? 'sandbox' : 'production',
    enableLogs: true,
    // Errors + logs + breadcrumbs only. No tracing, profiling or replay.
    tracesSampleRate: 0,
    maxBreadcrumbs: 50,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    ignoreErrors,
    integrations: [
      // Chain SDKs fire hundreds of RPC calls per screen and RPC URLs can carry
      // provider keys; the DokApi interceptor is the one HTTP signal we want.
      Sentry.breadcrumbsIntegration({xhr: false, fetch: false}),
    ],
    beforeSend,
    beforeBreadcrumb,
    beforeSendLog,
  });
  // Tags reach events; attributes reach logs. Set both so either view can be
  // filtered by variant.
  Sentry.setTag('variant', wlName);
  Sentry.setAttributes({variant: wlName});
};

const emitLog = level => (message, attrs) => {
  const attributes = compact(attrs);
  devPrint(
    level === 'warn' || level === 'error' ? level : 'log',
    `[${level}] ${message}`,
    attributes || '',
  );
  try {
    Sentry.logger[level](message, attributes);
  } catch (e) {
    // Never let observability break the app.
  }
};

export const logger = {
  debug: emitLog('debug'),
  info: emitLog('info'),
  warn: emitLog('warn'),
  error: emitLog('error'),
};

const toError = value => {
  if (value instanceof Error) {
    return value;
  }
  return new Error(typeof value === 'string' ? value : safeStringify(value));
};

// `tags` are indexed/searchable (short strings); `extra` is free-form context.
export const captureError = (error, {tags, extra, level} = {}) => {
  const err = toError(error);
  devPrint('error', '[captureError]', err, tags || '', extra || '');
  try {
    Sentry.captureException(err, {tags, extra, level});
  } catch (e) {
    // Never let observability break the app.
  }
};

export const addBreadcrumb = (category, message, data, level = 'info') => {
  try {
    Sentry.addBreadcrumb({category, message, data, level});
  } catch (e) {
    // Never let observability break the app.
  }
};

// The wallet's persisted masterClientId: stable per install, not tied to any
// address. Support can look up a user's events once they share it.
export const setUserContext = masterClientId => {
  try {
    // Reaches both events and logs as `user.id`.
    Sentry.setUser(masterClientId ? {id: String(masterClientId)} : null);
  } catch (e) {
    // Never let observability break the app.
  }
};

// One structured log per failed backend call: method, path, status. No body,
// no header values, no query string. Integrity header *presence* is recorded
// as booleans so a rejected request can be told apart from a missing proof.
const headerValue = (headers, name) => {
  if (!headers) {
    return undefined;
  }
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
};

export const attachDokApiLogging = axiosInstance => {
  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      const config = error?.config || {};
      const response = error?.response;
      logger.warn('dokapi.failed', {
        method: config.method ? String(config.method).toUpperCase() : undefined,
        path: stripQuery(config.url),
        status: response?.status,
        code: error?.code,
        app_name: headerValue(config.headers, 'x-app-name'),
        has_proof: !!headerValue(config.headers, 'x-integrity-proof'),
        has_key_id: !!headerValue(config.headers, 'x-integrity-key-id'),
        retried: !!config._integrityRetried,
        backend_code: response?.data?.code,
        backend_message:
          typeof response?.data?.message === 'string'
            ? response.data.message.slice(0, 200)
            : undefined,
      });
      return Promise.reject(error);
    },
  );
};
