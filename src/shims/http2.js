// shims/http2.js
module.exports = {
  connect: () => {
    throw new Error('http2 is not supported in React Native');
  },
  createServer: () => {
    throw new Error('http2 is not supported in React Native');
  },
  createSecureServer: () => {
    throw new Error('http2 is not supported in React Native');
  },
  getDefaultSettings: () => ({}),
  // eslint-disable-next-line no-undef
  getPackedSettings: () => Buffer.alloc(0),
  getUnpackedSettings: () => ({}),
  constants: {},
  Http2ServerRequest: class {},
  Http2ServerResponse: class {},
};
