import {IS_SANDBOX} from 'dok-wallet-blockchain-networks/config/config';
import {ELECTRUM_SERVER} from 'dok-wallet-blockchain-networks/config/electrumServers';
import {
  ELECTRUM_QUERIES,
  ElectrumClient,
} from 'dok-wallet-blockchain-networks/service/electrum';

/**
 * Electrum transport for React Native — the mobile half of the
 * `utils/electrumTransport` seam that `service/bitcoinDataSource` imports.
 *
 * On a phone we can open a raw TLS socket, so queries run against the Electrum
 * servers directly. The shared submodule holds the protocol; everything
 * platform-specific (the native socket module, the server order) lives here.
 */

// Required lazily and null-guarded: if the native module failed to link,
// isElectrumQueryAvailable() reports false and bitcoinDataSource goes straight
// to the backend rather than burning a 10s connect timeout per server.
let tcpSocketModule;
const getTcpSocket = () => {
  if (tcpSocketModule !== undefined) {
    return tcpSocketModule;
  }
  try {
    // The package assigns module.exports after its `export default`, which
    // drops the compiled `.default` property — fall back to the module itself.
    const mod = require('react-native-tcp-socket');
    tcpSocketModule = (mod && mod.default) || mod || null;
  } catch (e) {
    console.log('error in tcpSocketModule', e);
    tcpSocketModule = null;
  }
  return tcpSocketModule;
};

// Own Fulcrum first; the public servers below are automatic fallbacks, used
// only when it is unreachable. Order is this app's policy, not shared.
const SERVERS = IS_SANDBOX
  ? [ELECTRUM_SERVER.testnetAranguren, ELECTRUM_SERVER.testnetBlockstream]
  : [
      ELECTRUM_SERVER.own,
      ELECTRUM_SERVER.foundation,
      ELECTRUM_SERVER.bluewallet,
      ELECTRUM_SERVER.blockstream,
    ];

const socketFactory = ({host, port}, onConnect) =>
  getTcpSocket().connectTLS(
    {
      host,
      port,
      // Electrum servers commonly use self-signed certificates
      // (BlueWallet accepts them the same way).
      rejectUnauthorized: false,
    },
    onConnect,
  );

// One client, so one socket serves every query. Built lazily so merely
// importing this module never opens a connection.
let client = null;
const getClient = () => {
  if (!client) {
    client = new ElectrumClient({servers: SERVERS, socketFactory});
  }
  return client;
};

export const isElectrumQueryAvailable = () => !!getTcpSocket();

export const runElectrumQuery = (op, payload = {}) => {
  const query = ELECTRUM_QUERIES[op];
  if (!query) {
    throw new Error(`unknown electrum op: ${op}`);
  }
  return query(getClient(), payload);
};
