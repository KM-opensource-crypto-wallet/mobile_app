import {
  connect,
  defaultConfig,
  Network,
  Seed,
  ReceivePaymentMethod,
  SendPaymentMethod,
  SendPaymentMethod_Tags,
  InputType_Tags,
  SendPaymentOptions,
  OnchainConfirmationSpeed,
  MaxFee,
  Fee,
  PaymentStatus,
} from '@breeztech/breez-sdk-spark-react-native';

import {IS_SANDBOX} from 'dok-wallet-blockchain-networks/config/config';
import {DocumentDirectoryPath, mkdir} from 'react-native-fs';
import {
  convertToSmallAmount,
  parseBalance,
} from 'dok-wallet-blockchain-networks/helper';

let prepareSendResponse;
// Connected instances, keyed by mnemonic. This is the single source of truth:
// never gate a lookup on a mutable "current instance" global, or a failed
// connect for one wallet makes the next call re-connect an already-live one.
const sdkMap = new Map();
// In-flight connects, keyed by mnemonic. Keying matters: a single shared
// promise would hand wallet B the SDK of whichever wallet connected first.
const connectingMap = new Map();
// Only for callers that pass no phrase at all (getChain is called with
// currentWallet?.phrase, which can be undefined).
let lastConnectedSdk = null;

const commonConnectSdk = async mnemonic => {
  const workingDir = `${DocumentDirectoryPath.replace(
    'file://',
    '',
  )}/breezSdkSpark`;
  try {
    const network = IS_SANDBOX ? Network.Regtest : Network.Mainnet;
    let config = defaultConfig(network);
    config.apiKey = process.env.BREEZ_API_KEY;
    // Disable automatic claiming
    config.maxDepositClaimFee = undefined;
    await mkdir(workingDir);

    const seed = new Seed.Mnemonic({mnemonic});

    const sdk = await connect({
      config,
      seed,
      storageDir: workingDir,
    });
    sdkMap.set(mnemonic, sdk);
    lastConnectedSdk = sdk;
    return sdk;
  } catch (err) {
    // Breez errors are UniFFI variants: the cause lives in .tag/.inner, which
    // a bare console.error drops -- leaving only "Error" with no message.
    console.error('❌ Connection error:', {
      name: err?.constructor?.name,
      message: err?.message,
      tag: err?.tag,
      inner: err?.inner,
      storageDir: workingDir,
      raw: JSON.stringify(err, Object.getOwnPropertyNames(err || {})),
    });
    // Deliberately no shared state cleared here: one wallet's failure must
    // not invalidate another wallet's working instance.
    throw err;
  }
};

async function connectToSdk(phrase) {
  const mnemonic = phrase;
  if (!mnemonic) {
    return lastConnectedSdk;
  }
  const existing = sdkMap.get(mnemonic);
  if (existing) {
    return existing;
  }
  // Per mnemonic, so a concurrent connect for a DIFFERENT wallet is never
  // handed this wallet's in-flight promise.
  const inflight = connectingMap.get(mnemonic);
  if (inflight) {
    return inflight;
  }
  const promise = commonConnectSdk(mnemonic);
  connectingMap.set(mnemonic, promise);
  try {
    return await promise;
  } finally {
    connectingMap.delete(mnemonic);
  }
}

async function prepareAndSendPayment(phrase, paymentRequest, amount) {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk || !paymentRequest) {
      console.log('Error', 'SDK not connected or no payment request');
      return;
    }
    const prepareResponse = await sdk.prepareSendPayment({
      paymentRequest,
      amount: BigInt(convertToSmallAmount(amount, 8)),
    });
    prepareSendResponse = prepareResponse;
    if (
      prepareResponse.paymentMethod instanceof SendPaymentMethod.Bolt11Invoice
    ) {
      const lightningFee = prepareResponse.paymentMethod.inner.lightningFeeSats;
      const sparkFee = prepareResponse.paymentMethod.inner.sparkTransferFeeSats;

      return {
        lightningFee: lightningFee,
        sparkFee: sparkFee,
      };
    }
    if (
      prepareResponse.paymentMethod?.tag === SendPaymentMethod_Tags.SparkAddress
    ) {
      const feeSats = prepareResponse.paymentMethod.inner.fee;
      return {
        lightningFee: feeSats,
        sparkFee: '',
      };
    }
    if (
      prepareResponse.paymentMethod?.tag ===
      SendPaymentMethod_Tags.BitcoinAddress
    ) {
      const feeQuote = prepareResponse.paymentMethod.inner.feeQuote;
      const fastFeeSats =
        feeQuote.speedFast.userFeeSat + feeQuote.speedFast.l1BroadcastFeeSat;
      return {
        lightningFee: fastFeeSats,
        sparkFee: '',
      };
    }
    return {};
  } catch (err) {
    console.error('Error preparing payment:', err);
    return {};
  }
}

export const getLightningBalance = async phrase => {
  try {
    const sdk = await connectToSdk(phrase);
    const info = await sdk.getInfo({});
    return info.balanceSats;
  } catch (error) {
    console.log(error);
  }
};

export const isLightningAddressValid = async (address, phrase) => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk) {
      console.log('Error', 'SDK not connected or no payment request');
      return;
    }
    const input = await sdk.parse(address);
    if (input.tag === InputType_Tags.BitcoinAddress) {
      return true;
    } else if (input.tag === InputType_Tags.Bolt11Invoice) {
      return true;
    } else if (input.tag === InputType_Tags.SparkAddress) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const generateLightningInvoiceViaBolt11 = async phrase => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk) {
      console.log('Error', 'SDK not connected');
      return;
    }
    const response = await sdk.receivePayment({
      paymentMethod: new ReceivePaymentMethod.Bolt11Invoice({
        description: 'Payment',
      }),
    });
    return {
      address: response.paymentRequest,
      receiveFeeSats: response.fee,
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    console.log('Invoice Error', error.message);
  }
};

export const generateLightningSparkAddress = async phrase => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk) {
      console.log('Error', 'SDK not connected');
      return;
    }
    const response = await sdk.receivePayment({
      paymentMethod: new ReceivePaymentMethod.SparkAddress(),
    });

    return {
      address: response.paymentRequest,
      privateKey: null,
      publicKey: null,
      receiveFeeSats: response.fee,
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    console.log('Invoice Error', error.message);
  }
};

export const generateLightningInvoiceViaBitcoinAddress = async phrase => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk) {
      console.log('Error', 'SDK not connected');
      return;
    }
    const response = await sdk.receivePayment({
      paymentMethod: new ReceivePaymentMethod.BitcoinAddress(),
    });
    return {
      address: response.paymentRequest,
      receiveFeeSats: response.fee,
    };
  } catch (err) {
    console.error('Error generating invoice:', err);
    console.log('Invoice Error', err.message);
  }
};

export const prepareLightning = async (phrase, toAddress, amount) => {
  try {
    const {lightningFee} = await prepareAndSendPayment(
      phrase,
      toAddress,
      amount,
    );
    const fee = parseBalance(lightningFee, 8);
    return {
      fee: fee,
      estimateGas: 0,
      feesOptions: [],
    };
  } catch (error) {
    console.error('Error in bitcoin gas fee', error);
    throw error;
  }
};

export const sendLightning = async phrase => {
  try {
    let options;
    const sdk = await connectToSdk(phrase);
    if (!sdk || !prepareSendResponse) {
      console.log('Error', 'SDK not connected or no payment request');
      return;
    }

    if (
      prepareSendResponse.paymentMethod?.tag ===
      SendPaymentMethod_Tags.SparkAddress
    ) {
      console.log(
        `Fees: ${prepareSendResponse.paymentMethod.inner.fee} token base units`,
      );
    }
    if (
      prepareSendResponse.paymentMethod?.tag ===
      SendPaymentMethod_Tags.SparkInvoice
    ) {
      console.log(
        `Fees: ${prepareSendResponse.paymentMethod.inner.fee} token base units`,
      );
    }
    if (
      prepareSendResponse.paymentMethod?.tag ===
      SendPaymentMethod_Tags.BitcoinAddress
    ) {
      options = new SendPaymentOptions.BitcoinAddress({
        confirmationSpeed: OnchainConfirmationSpeed.Fast,
      });
    }

    // Send the token payment
    const sendResponse = await sdk.sendPayment({
      prepareResponse: prepareSendResponse,
      options: options,
      idempotencyKey: undefined,
    });
    const payment = sendResponse.payment;
    return payment.id;
  } catch (error) {
    console.error('Error:  ', error);
    throw error;
  }
};

export const waitForLightningConfirmation = async (phrase, txData) => {
  const sdk = await connectToSdk(phrase);

  if (!sdk) {
    console.error('Error', 'SDK not connected');
    return;
  }
  const {transaction, interval, retries} = txData || {};

  if (!transaction) {
    console.error('No transaction id found for bitcoin lightning');
    return null;
  }
  return new Promise((resolve, reject) => {
    let numberOfRetries = 0;
    let timer = setInterval(async () => {
      try {
        numberOfRetries += 1;
        const response = await sdk.getPayment({
          paymentId: transaction,
        });
        const status = response.payment.status;
        if (status === PaymentStatus.Completed) {
          clearInterval(timer);
          resolve(response);
        } else if (status === PaymentStatus.Failed) {
          clearInterval(timer);
          reject('failed');
        } else if (numberOfRetries === retries) {
          clearInterval(timer);
          resolve('pending');
        }
      } catch (e) {
        clearInterval(timer);
        console.error('Error in get transaction for lightning chain', e);
        reject(e);
      }
    }, interval);
  });
};

export const getLightningTransactions = async phrase => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk) return;
    const response = await sdk.listPayments({
      offset: undefined,
      limit: 20,
    });
    let address;
    if (response.payments.length) {
      const response2 = await sdk.receivePayment({
        paymentMethod: new ReceivePaymentMethod.SparkAddress(),
      });
      address = response2.paymentRequest;
    }

    const transactions = response.payments;
    if (Array.isArray(transactions)) {
      return transactions.map(item => {
        const txHash = item?.id;
        item?.details.inner?.txId || item?.details.inner?.paymentHash || 'N/A';
        return {
          amount: item.amount,
          link: txHash,
          url: null,
          status: item?.status ? 'Pending' : 'SUCCESS',
          date: Number(item?.timestamp) * 1000,
          from: item.paymentType === 1 ? null : address,
          to: item.paymentType === 1 ? address : null,
          paymentType: item.paymentType,
          totalCourse: '0$',
          transactionType: 'regular',
        };
      });
    }
    return [];
  } catch (error) {
    console.error(`error getting transactions for bitcoin lightning ${error}`);
    return [];
  }
};

export const getLightningTransaction = async (phrase, txHash) => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk || !txHash) return null;
    const response = await sdk.getPayment({paymentId: txHash});
    const item = response?.payment;
    if (!item) return null;

    const hash =
      item?.details?.inner?.txId ||
      item?.details?.inner?.paymentHash ||
      item?.id ||
      'N/A';

    return {
      data: {
        amount: item.amount,
        link: hash,
        url: null,
        status: item?.status ? 'Pending' : 'SUCCESS',
        date: Number(item?.timestamp) * 1000,
        from: item.paymentType === 1 ? null : undefined,
        to: item.paymentType === 1 ? undefined : null,
        paymentType: item.paymentType,
        totalCourse: '0$',
      },
    };
  } catch (error) {
    console.error(
      `error getting transaction by hash for bitcoin lightning ${error}`,
    );
    return null;
  }
};

export const claimOnchainDeposit = async phrase => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk) return;
    const request = {};
    const result = [];
    const response = await sdk.listUnclaimedDeposits(request);
    for (const deposit of response.deposits) {
      const requiredFeeRate =
        deposit.claimError.inner.requiredFeeSats || BigInt(0);

      const amountReceive = deposit.amountSats - requiredFeeRate;
      result.push({
        txid: deposit.txid,
        vout: deposit.vout,
        amount: parseBalance(deposit.amountSats, 8),
        fees: parseBalance(requiredFeeRate, 8),
        receivedAmount: parseBalance(amountReceive, 8),
      });
    }
    return result;
  } catch (error) {
    console.error(`error getting transactions for bitcoin lightning ${error}`);
    return [];
  }
};

export const approveClaimDepositRequest = async (phrase, txData) => {
  try {
    const {txid, vout, fees} = txData || {};
    const sdk = await connectToSdk(phrase);
    if (!sdk) return;

    const claimRequest = {
      txid: txid,
      vout: vout,
      maxFee: new MaxFee.Rate({
        satPerVbyte: BigInt(convertToSmallAmount(fees, 8)),
      }),
    };
    await sdk.claimDeposit(claimRequest);
    return true;
  } catch (error) {
    console.error(
      `error approving deposit request for bitcoin lightning ${error}`,
    );
    return false;
  }
};

export const refundClaimRequest = async (phrase, txData) => {
  try {
    const {txid, vout, destinationAddress} = txData || {};
    const sdk = await connectToSdk(phrase);
    if (!sdk) return;
    const recommendedFees = await sdk.recommendedFees();
    const fee = new Fee.Rate({satPerVbyte: recommendedFees.halfHourFee});
    const request = {
      txid,
      vout,
      destinationAddress,
      fee,
    };
    await sdk.refundDeposit(request);
    return true;
  } catch (error) {
    console.log(JSON.stringify(error));
    console.error(`error refund transactions for bitcoin lightning ${error}`);
    return false;
  }
};
