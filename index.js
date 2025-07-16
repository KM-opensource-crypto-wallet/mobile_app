/**
 * @format
 */

import './shim';

// if(typeof require('stream/web') === 'undefined') {
//   console.log('is undefined')
// }
// import 'node-libs-react-native/globals';
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
