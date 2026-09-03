/**
 * @format
 */

import 'node-libs-react-native/globals';
import BigNumber from 'bignumber.js';
import 'text-encoding-polyfill';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@ethersproject/shims';
import './shim';
import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as coinswallet} from './app.json';
import {Bugfender} from '@bugfender/rn-bugfender';
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
// Every other event (dismiss, other notification types) is left alone.
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type !== EventType.PRESS) {
    return;
  }
  const data = detail?.notification?.data;
  if (data?.type !== SCHEDULED_PAYMENT_NOTIFICATION_TYPE) {
    return;
  }
  await storeAsyncStorageData(
    SCHEDULED_PAYMENT_BACKGROUND_PRESS_STORAGE_KEY,
    JSON.stringify(data),
  );
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

if (!__DEV__) {
  Bugfender.init({
    appKey: process.env.BUGFENDER_APP_KEY,
    logUIEvents: false,
    enableLogcatLogging: false, // Android specific
    printToConsole: false,
  })
    .then(() => {
      console.log('init bugfender');
    })
    .catch(err => {
      console.error('Error in setup bugfender', err);
    });
}

AppRegistry.registerComponent(coinswallet, () => App);

if (Platform.OS === 'web') {
  const rootTag =
    document.getElementById('root') || document.getElementById('coinswallet');
  AppRegistry.runApplication('coinswallet', {rootTag});
}
