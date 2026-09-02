// A fake SDK per mnemonic, so which instance a caller received is directly
// observable through the balance getLightningBalance returns.
const balanceFor = mnemonic => `${mnemonic}-balance`;

jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  connect: jest.fn(),
  initLogging: jest.fn(),
  defaultConfig: jest.fn(() => ({})),
  Network: {Mainnet: 'mainnet', Regtest: 'regtest'},
  Seed: {
    Mnemonic: class {
      constructor({mnemonic}) {
        this.mnemonic = mnemonic;
      }
    },
  },
  ReceivePaymentMethod: {},
  SendPaymentMethod: {
    Bolt11Invoice: class {
      constructor(inner) {
        this.inner = inner;
        this.tag = 'Bolt11Invoice';
      }
    },
  },
  SendPaymentMethod_Tags: {},
  PaymentRequest: {
    Input: class {
      constructor(inner) {
        this.inner = inner;
        this.tag = 'Input';
      }
    },
  },
  InputType_Tags: {},
  SendPaymentOptions: {},
  OnchainConfirmationSpeed: {},
  MaxFee: {},
  Fee: {},
  PaymentStatus: {},
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp/docs',
  mkdir: jest.fn(() => Promise.resolve()),
}));

jest.mock('dok-wallet-blockchain-networks/config/config', () => ({
  IS_SANDBOX: false,
}));

jest.mock('dok-wallet-blockchain-networks/helper', () => ({
  convertToSmallAmount: jest.fn(),
  parseBalance: jest.fn(value => value),
}));

global.__DEV__ = false;

// The service keeps connection state at module scope, so every test needs a
// fresh copy -- and the breez mock must come from the SAME fresh registry as
// the service, or the assertions would watch a different jest.fn.
const load = () => {
  jest.resetModules();
  const breez = require('@breeztech/breez-sdk-spark-react-native');
  const {getLightningBalance} = require('myWallet/wallet-lightning.service');
  // `gate` lets a test hold connects open (to force real overlap) or reject.
  const state = {gate: null};
  breez.connect.mockImplementation(async ({seed}) => {
    const mnemonic = seed.mnemonic;
    if (state.gate) {
      await state.gate(mnemonic);
    }
    return {getInfo: async () => ({balanceSats: balanceFor(mnemonic)})};
  });
  return {getBalance: getLightningBalance, connect: breez.connect, state};
};

const openGate = () => {
  let release;
  const promise = new Promise(resolve => {
    release = resolve;
  });
  return {promise, release};
};

describe('connectToSdk wallet isolation', () => {
  it('gives each wallet its own SDK when two connect concurrently', async () => {
    const {getBalance, connect, state} = load();
    const gate = openGate();
    state.gate = () => gate.promise;

    const both = Promise.all([getBalance('wallet-a'), getBalance('wallet-b')]);
    gate.release();
    const [balanceA, balanceB] = await both;

    // Before the fix, wallet-b was handed wallet-a's in-flight promise and
    // reported wallet-a's balance.
    expect(balanceA).toBe(balanceFor('wallet-a'));
    expect(balanceB).toBe(balanceFor('wallet-b'));
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('reuses a cached instance after another wallet fails to connect', async () => {
    const {getBalance, connect, state} = load();
    expect(await getBalance('wallet-a')).toBe(balanceFor('wallet-a'));
    expect(connect).toHaveBeenCalledTimes(1);

    state.gate = mnemonic =>
      mnemonic === 'wallet-b'
        ? Promise.reject(new Error('connect failed'))
        : Promise.resolve();
    await getBalance('wallet-b');
    expect(connect).toHaveBeenCalledTimes(2);

    // Before the fix, wallet-b's failure nulled the shared instance and this
    // call opened a SECOND live connection for wallet-a.
    state.gate = null;
    expect(await getBalance('wallet-a')).toBe(balanceFor('wallet-a'));
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('collapses concurrent connects for the same wallet into one', async () => {
    const {getBalance, connect, state} = load();
    const gate = openGate();
    state.gate = () => gate.promise;

    const both = Promise.all([getBalance('wallet-a'), getBalance('wallet-a')]);
    gate.release();
    const [first, second] = await both;

    expect(first).toBe(balanceFor('wallet-a'));
    expect(second).toBe(balanceFor('wallet-a'));
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('does not reconnect a wallet that is already connected', async () => {
    const {getBalance, connect} = load();
    await getBalance('wallet-a');
    await getBalance('wallet-a');
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed connect instead of caching the failure', async () => {
    const {getBalance, connect, state} = load();
    state.gate = () => Promise.reject(new Error('connect failed'));
    await getBalance('wallet-a');
    expect(connect).toHaveBeenCalledTimes(1);

    state.gate = null;
    expect(await getBalance('wallet-a')).toBe(balanceFor('wallet-a'));
    expect(connect).toHaveBeenCalledTimes(2);
  });

  describe('with no phrase', () => {
    it('falls back to the most recently connected wallet', async () => {
      const {getBalance, connect} = load();
      await getBalance('wallet-a');
      connect.mockClear();

      expect(await getBalance(undefined)).toBe(balanceFor('wallet-a'));
      expect(connect).not.toHaveBeenCalled();
    });

    it('resolves without throwing when nothing is connected yet', async () => {
      const {getBalance, connect} = load();
      expect(await getBalance(undefined)).toBeUndefined();
      expect(connect).not.toHaveBeenCalled();
    });
  });
});

describe('prepareLightning', () => {
  // prepareSendPayment is the only SDK call in the estimate path, so a fake
  // sdk carrying just that method is enough to drive both outcomes.
  const loadPrepare = () => {
    jest.resetModules();
    const breez = require('@breeztech/breez-sdk-spark-react-native');
    const helper = require('dok-wallet-blockchain-networks/helper');
    const {prepareLightning} = require('myWallet/wallet-lightning.service');
    const sdk = {prepareSendPayment: jest.fn()};
    breez.connect.mockImplementation(async () => sdk);
    helper.convertToSmallAmount.mockReturnValue('6608');
    return {prepareLightning, sdk, breez};
  };

  const INVOICE = 'lnbc66080n1p4gccf9pp5zn4fkzz39983lvzz4a2yye8pye3zja6hxkkdc9';

  it('rejects when the SDK cannot prepare the payment', async () => {
    const {prepareLightning, sdk} = loadPrepare();
    sdk.prepareSendPayment.mockRejectedValue(new Error('prepare blew up'));

    // Before the fix prepareAndSendPayment swallowed this and returned {}, so
    // prepareLightning resolved to {fee: '0'}: calculateEstimateFee reported
    // success and Transfer rendered the form with a zero fee instead of its
    // error view.
    await expect(
      prepareLightning('wallet-a', INVOICE, '0.00006608'),
    ).rejects.toThrow('prepare blew up');
  });

  it('rejects when the prepared payment method is not one we can price', async () => {
    const {prepareLightning, sdk} = loadPrepare();
    sdk.prepareSendPayment.mockResolvedValue({paymentMethod: {tag: 'Unknown'}});

    await expect(
      prepareLightning('wallet-a', INVOICE, '0.00006608'),
    ).rejects.toThrow('Unsupported lightning payment method');
  });

  it('sends the invoice as a PaymentRequest.Input and returns the fee', async () => {
    const {prepareLightning, sdk, breez} = loadPrepare();
    sdk.prepareSendPayment.mockResolvedValue({
      paymentMethod: new breez.SendPaymentMethod.Bolt11Invoice({
        lightningFeeSats: 12n,
        sparkTransferFeeSats: undefined,
      }),
    });

    const result = await prepareLightning('wallet-a', INVOICE, '0.00006608');

    // SDK 0.23.0 takes the PaymentRequest tagged union, not a bare string; a
    // string has no `.tag` and dies in the FFI lowering with "Raw enum value
    // doesn't match any cases".
    const request = sdk.prepareSendPayment.mock.calls[0][0];
    expect(request.paymentRequest).toBeInstanceOf(breez.PaymentRequest.Input);
    expect(request.paymentRequest.inner).toEqual({input: INVOICE});
    expect(request.amount).toBe(6608n);
    expect(result.fee).toBe(12n);
  });
});
