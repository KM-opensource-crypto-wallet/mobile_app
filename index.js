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
