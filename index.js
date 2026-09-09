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
import App from './App';
import {name as coinswallet} from './app.json';
import * as Sentry from '@sentry/react-native';
import {initSentry} from 'services/logger';

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

AppRegistry.registerComponent(coinswallet, () => Sentry.wrap(App));

if (Platform.OS === 'web') {
  const rootTag =
    document.getElementById('root') || document.getElementById('coinswallet');
  AppRegistry.runApplication('coinswallet', {rootTag});
}
