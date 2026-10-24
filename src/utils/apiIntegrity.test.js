// iOS App Attest registration: a failure backs off instead of latching for the
// session, a key Apple refused is discarded (kept only on serverUnavailable),
// and Apple's own error text reaches the logs.
jest.mock('@pagopa/io-react-native-integrity', () => ({
  generateHardwareKey: jest.fn(),
  generateHardwareSignatureWithAssertion: jest.fn(),
  getAttestation: jest.fn(),
  isAttestationServiceAvailable: jest.fn(),
  isPlayServicesAvailable: jest.fn(),
  prepareIntegrityToken: jest.fn(),
  requestIntegrityToken: jest.fn(),
}));
jest.mock('utils/wlData', () => ({wlName: 'dokwallet'}));
jest.mock('dok-wallet-blockchain-networks/config/config', () => ({
  config: {ATTEST_WORKER_BASE_URL: 'https://attest.test'},
}));

const KEY_ID_ITEM = 'integrity_ios_key_id';
const PROOF_HEADER = 'x-integrity-proof';

// The library rejects with its own code as the message and Apple's DCError
// description in userInfo.error.
const appAttestError = (message, dcErrorCode) =>
  Object.assign(new Error(message), {
    code: '-1',
    userInfo: {
      error: `The operation couldn’t be completed. (com.apple.devicecheck.error error ${dcErrorCode}.)`,
    },
  });

let integrity;
let attest;
let sensitiveInfo;
let requestInterceptor;
let now;

const challengeCalls = () =>
  global.fetch.mock.calls.filter(([url]) => url.endsWith('/attest/challenge'))
    .length;

const sendRequest = () =>
  requestInterceptor({method: 'post', url: '/list-crypto', data: {}});

// Looked up by key: the service name comes from the app's env.
const storedKeyId = async () => {
  for (const [id, item] of sensitiveInfo.__mock.items) {
    if (id.endsWith(`::${KEY_ID_ITEM}`)) {
      return item.value;
    }
  }
  return null;
};

beforeEach(() => {
  jest.resetModules();
  sensitiveInfo = require('react-native-sensitive-info');
  attest = require('@pagopa/io-react-native-integrity');
  integrity = require('./apiIntegrity');

  now = 1_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  let keyCount = 0;
  attest.isAttestationServiceAvailable.mockResolvedValue(true);
  attest.generateHardwareKey.mockImplementation(async () => {
    keyCount += 1;
    return `key-${keyCount}`;
  });
  attest.getAttestation.mockResolvedValue('attestation');
  attest.generateHardwareSignatureWithAssertion.mockResolvedValue('assertion');

  global.fetch = jest.fn(async url => ({
    ok: true,
    status: 200,
    json: async () =>
      url.endsWith('/attest/challenge')
        ? {challengeId: 'c1', challenge: 'Y2hhbGxlbmdl'}
        : {},
  }));

  const dokApi = {
    interceptors: {
      request: {
        use: jest.fn(onFulfilled => (requestInterceptor = onFulfilled)),
      },
      response: {use: jest.fn()},
    },
    request: jest.fn(),
  };
  integrity.setupDokApiIntegrity(dokApi);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('discards a refused key, backs off, then registers a fresh key', async () => {
  attest.getAttestation.mockRejectedValueOnce(
    appAttestError('ATTESTATION_ERROR', 2),
  );

  const failed = await sendRequest();
  expect(failed.headers[PROOF_HEADER]).toBeUndefined();
  expect(failed.headers['x-app-name']).toBe('dokwallet-ios');
  expect(await storedKeyId()).toBeNull();
  // Apple's reason is in the log, not just the library's code.
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('retry in 30s'),
    expect.stringContaining('com.apple.devicecheck.error error 2'),
  );

  // Inside the backoff: no new challenge, still no proof.
  now += 10_000;
  const waiting = await sendRequest();
  expect(waiting.headers[PROOF_HEADER]).toBeUndefined();
  expect(challengeCalls()).toBe(1);

  now += 21_000;
  const recovered = await sendRequest();
  expect(challengeCalls()).toBe(2);
  expect(recovered.headers[PROOF_HEADER]).toBe('assertion');
  expect(recovered.headers['x-integrity-key-id']).toBe('key-2');
  expect(await storedKeyId()).toBe('key-2');
});

it("keeps the key when Apple's server is unavailable", async () => {
  attest.getAttestation.mockRejectedValueOnce(
    appAttestError('ATTESTATION_ERROR', 3),
  );

  await sendRequest();
  expect(await storedKeyId()).toBe('key-1');

  now += 31_000;
  const recovered = await sendRequest();
  expect(attest.generateHardwareKey).toHaveBeenCalledTimes(1);
  expect(attest.getAttestation).toHaveBeenLastCalledWith(
    'Y2hhbGxlbmdl',
    'key-1',
  );
  expect(recovered.headers['x-integrity-key-id']).toBe('key-1');
});

it('doubles the wait after each failure in a row', async () => {
  global.fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await sendRequest();

  now += 31_000;
  global.fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await sendRequest();
  expect(console.error).toHaveBeenLastCalledWith(
    expect.stringContaining('retry in 60s'),
    'Network request failed',
  );

  now += 31_000;
  await sendRequest();
  expect(challengeCalls()).toBe(2);

  now += 30_000;
  const recovered = await sendRequest();
  expect(challengeCalls()).toBe(3);
  expect(recovered.headers[PROOF_HEADER]).toBe('assertion');
});

it('a successful registration resets the backoff', async () => {
  global.fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await sendRequest();
  now += 31_000;
  await sendRequest();

  // The key stops working (e.g. the app was reinstalled): the next request
  // drops the registration, and the one after has to register again.
  attest.generateHardwareSignatureWithAssertion.mockRejectedValueOnce(
    appAttestError('GENERATION_ASSERTION_FAILED', 2),
  );
  await sendRequest();
  expect(console.warn).toHaveBeenCalledWith(
    '[integrity] iOS assertion failed, re-registering:',
    expect.stringContaining('com.apple.devicecheck.error error 2'),
  );

  global.fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await sendRequest();
  expect(console.error).toHaveBeenLastCalledWith(
    expect.stringContaining('retry in 30s'),
    'Network request failed',
  );
});
