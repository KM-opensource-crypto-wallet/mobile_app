// TextEncoder/TextDecoder polyfill for @meshsdk/core and other libraries
if (
  typeof global.TextEncoder === 'undefined' ||
  typeof global.TextDecoder === 'undefined'
) {
  const TextEncoding = require('text-encoding');
  global.TextEncoder = TextEncoding.TextEncoder;
  global.TextDecoder = TextEncoding.TextDecoder;
}

if (typeof __dirname === 'undefined') {
  global.__dirname = '/';
}
if (typeof __filename === 'undefined') {
  global.__filename = '';
}
// if (typeof process === 'undefined') {
//   global.process = require('process');
// } else {
//   const bProcess = require('process');
//   for (var p in bProcess) {
//     if (!(p in process)) {
//       process[p] = bProcess[p];
//     }
//   }
// }

// process.browser = false;
//
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}
// eslint-disable-next-line no-undef
Uint8Array.prototype.copy = Buffer.prototype.copy;

// Polyfill for Event (required by aptos other web-based libraries)
if (typeof Event === 'undefined') {
  global.Event = class Event {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.bubbles = eventInitDict.bubbles || false;
      this.cancelable = eventInitDict.cancelable || false;
      this.composed = eventInitDict.composed || false;
      this.defaultPrevented = false;
      this.timeStamp = Date.now();
    }

    preventDefault() {
      if (this.cancelable) {
        this.defaultPrevented = true;
      }
    }

    stopPropagation() {}
    stopImmediatePropagation() {}
  };
}

// global.location = global.location || { port: 80 }
// const isDev = typeof __DEV__ === 'boolean' && __DEV__;
// process.env.NODE_ENV = isDev ? 'development' : 'production';
// if (typeof localStorage !== 'undefined') {
//   localStorage.debug = isDev ? '*' : '';
// }

// If using the crypto shim, uncomment the following line to ensure
// crypto is loaded first, so it can populate global.crypto
// require('crypto')
