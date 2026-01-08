// shims/tls.js
module.exports = {
  connect: () => {
    throw new Error('TLS is not supported in React Native');
  },
  createSecureContext: () => ({}),
  DEFAULT_ECDH_CURVE: 'auto',
};
