/**
 * @format
 */

// Buffer-only Hermes TypedArray fix; must run before any library touches
// Uint8Array subclasses (see src/shims/hermesTypedArrays.js).
import './src/shims/hermesTypedArrays';
import 'node-libs-react-native/globals';
import BigNumber from 'bignumber.js';
import 'text-encoding-polyfill';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@ethersproject/shims';
import './shim';
import {AppRegistry, Platform} from 'react-native';
import {name as coinswallet} from './app.json';
import * as Sentry from '@sentry/react-native';
import {initSentry} from 'services/logger';
import notifee, {EventType} from '@notifee/react-native';
import {
  SCHEDULED_PAYMENT_NOTIFICATION_TYPE,
  SCHEDULED_PAYMENT_BACKGROUND_PRESS_STORAGE_KEY,
} from 'providers/LocalNotificationProvider';
import {storeAsyncStorageData} from 'utils/asyncStorage';

// Required registration point for notifee so Android can deliver
// press/dismiss events for trigger notifications fired while the app is
// backgrounded or killed. There is no safe navigation target from this
// headless context, so a killed-app press is instead picked up once JS
// resumes via notifee.getInitialNotification(), and a foreground press via
// onForegroundEvent — both handled in providers/LocalNotificationProvider.
// A press while merely backgrounded (JS alive but not foreground) only
// reaches this handler and neither of those, so persist it here for
// LocalNotificationProvider to consume once the app becomes active again.
// A scheduled-payment DELIVERED event (Android fires it here while the app
// is away; iOS has no such callback) runs the same reconcile the foreground
// handler does, so a far-future run hands over to its native repeat and a
// finished run's repeat is cancelled without waiting for the app to be
// opened. Every other event (dismiss, other notification types) is left
// alone.
const syncScheduledPaymentRemindersInBackground = async () => {
  // In a killed-app headless context the persisted state has to be
  // rehydrated before the plan is computed — reconciling against an empty
  // store would cancel every reminder. Required here rather than imported so
  // the slice's thunk only loads when a reminder actually fires.
  const {store, persistor} = require('./src/redux/store');
  const {
    syncScheduledPaymentNotifications,
  } = require('dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSlice');
  await new Promise(resolve => {
    if (persistor.getState().bootstrapped) {
      resolve();
      return;
    }
    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        unsubscribe();
        resolve();
      }
    });
  });
  const scheduledPayments =
    store.getState().schedulePayment?.scheduledPayments || {};
  if (!Object.values(scheduledPayments).some(list => list?.length)) {
    // One of our reminders just fired, so a schedule existed; an empty
    // slice here means rehydration failed or the app already deleted the
    // payment and reconciled. Either way, don't touch the OS.
    return;
  }
  await store.dispatch(syncScheduledPaymentNotifications());
};

notifee.onBackgroundEvent(async ({type, detail}) => {
  const data = detail?.notification?.data;
  if (data?.type !== SCHEDULED_PAYMENT_NOTIFICATION_TYPE) {
    return;
  }
  if (type === EventType.PRESS) {
    await storeAsyncStorageData(
      SCHEDULED_PAYMENT_BACKGROUND_PRESS_STORAGE_KEY,
      JSON.stringify(data),
    );
  } else if (type === EventType.DELIVERED) {
    try {
      await syncScheduledPaymentRemindersInBackground();
    } catch (e) {
      console.warn('Failed to sync scheduled payment reminders', e);
    }
  }
});

import structuredClone from '@ungap/structured-clone';

// Crypto amounts routinely fall below BigNumber's default exponential
// threshold of 1e-7 (a 13-sat fee is 1.3e-7 BTC), which made toString() render
// amounts as "1.3e-7". Widen the range so no balance, fee or amount is ever
// displayed in scientific notation. Bounds cover 18-decimal assets and
// wei-scale raw values. Only this instance is affected; copies vendored inside
// tronweb/xchainjs keep their own defaults.
BigNumber.config({EXPONENTIAL_AT: [-30, 40]});

if (Platform.OS !== 'web' && !('structuredClone' in global)) {
  global.structuredClone = structuredClone;
}

// Error reporting + logs. Must run before any app module executes so console
// capture and the global error handler cover startup. `enabled` inside
// initSentry decides whether events actually leave the device.
initSentry();

// Loaded after initSentry() on purpose: a static `import App` is hoisted and
// would evaluate the whole app module graph before Sentry is installed, so a
// startup evaluation failure (bad polyfill, throwing top-level code) would
// never be reported.
const App = require('./App').default;

AppRegistry.registerComponent(coinswallet, () => Sentry.wrap(App));

if (Platform.OS === 'web') {
  const rootTag =
    document.getElementById('root') || document.getElementById('coinswallet');
  AppRegistry.runApplication('coinswallet', {rootTag});
}
