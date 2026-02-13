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
  DepositClaimError_Tags,
  MaxFee,
  Fee,
} from '@breeztech/breez-sdk-spark-react-native';

import {config, IS_SANDBOX} from 'dok-wallet-blockchain-networks/config/config';
import {DocumentDirectoryPath} from 'react-native-fs';
class JsEventListener {
  constructor(callback) {
    this.callback = callback;
  }

  onEvent = event => {
    if (this.callback) {
      this.callback(event);
    }
  };
}

let sdkInstance = null;
let connectingPromise = null;
let prepareSendResponse;
const sdkMap = new Map();

const commonConnectSdk = async mnemonic => {
  try {
    const network = IS_SANDBOX ? Network.Regtest : Network.Mainnet;
    let config = defaultConfig(network);
    config.apiKey = process.env.BREEZ_API_KEY;
    // Disable automatic claiming
    config.maxDepositClaimFee = undefined;
    const baseDir = DocumentDirectoryPath.replace('file://', '');
    const workingDir = `${baseDir}breezSdkSpark`;

    const seed = new Seed.Mnemonic({mnemonic});

    sdkInstance = await connect({
      config,
      seed,
      storageDir: workingDir,
    });
    sdkMap.set(mnemonic, sdkInstance);
    console.log('✅ Breez SDK connected');
    return sdkInstance;
  } catch (err) {
    console.error('❌ Connection error:', err);
    sdkInstance = null;
    connectingPromise = null;
    throw err;
  }
};

async function connectToSdk(phrase) {
  let mnemonic = phrase;
  if (sdkInstance) {
    if (sdkMap.has(mnemonic)) {
      console.log('♻️ Reusing SDK');
      return sdkMap.get(mnemonic);
    } else {
      // Initialize sdkInstance for the new mnemonic
      if (!mnemonic) return sdkInstance;
      connectingPromise = commonConnectSdk(mnemonic);
      return connectingPromise;
    }
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = commonConnectSdk(mnemonic);

  return connectingPromise;
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
      amount: decimalStringToBigInt(amount, 8),
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

function satoshiToBtc(sats) {
  if (sats === null || sats === undefined) return 0;

  const satsNumber = Number(sats);

  return satsNumber / 1e8;
}

function decimalStringToBigInt(value, decimals) {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error('Invalid decimal string');
  }

  const [intPart, fracPart = ''] = value.split('.');
  const paddedFrac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);

  return BigInt(intPart + paddedFrac);
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
    const fee = satoshiToBtc(lightningFee);
    console.log('fee:', fee);
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
        `Token ID: ${prepareSendResponse.paymentMethod.inner.tokenIdentifier}`,
      );
      console.log(
        `Fees: ${prepareSendResponse.paymentMethod.inner.fee} token base units`,
      );
    }
    if (
      prepareSendResponse.paymentMethod?.tag ===
      SendPaymentMethod_Tags.SparkInvoice
    ) {
      console.log(
        `Token ID: ${prepareSendResponse.paymentMethod.inner.tokenIdentifier}`,
      );
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
    console.log('prepareSendResponse:', prepareSendResponse);

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

export const waitForLightningConfirmation = async phrase => {
  const sdk = await connectToSdk(phrase);

  if (!sdk) {
    console.log('Error', 'SDK not connected');
    return;
  }

  return new Promise((resolve, reject) => {
    let listenerId = null;
    let timeoutId = null;
    let resolved = false;

    try {
      const eventListener = new JsEventListener(async event => {
        console.log('event:', event);

        if (resolved) return;

        if (event.tag === 'PaymentSucceeded' || event.tag === 'Synced') {
          resolved = true;

          // 🧹 cleanup
          if (listenerId !== null) {
            sdk.removeEventListener(listenerId);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          resolve(true);
        }
      });

      listenerId = sdk.addEventListener(eventListener);
      console.log('Event listener registered:', listenerId);

      // ⏱️ 90 seconds timeout
      timeoutId = setTimeout(() => {
        if (resolved) return;

        resolved = true;

        console.log('⏱️ Payment confirmation timeout (90s)');

        // 🧹 cleanup
        if (listenerId !== null) {
          sdk.removeEventListener(listenerId);
        }

        resolve('pending');
      }, 90_000); // 90 seconds
    } catch (error) {
      console.error('Error in waitForConfirmation:', error);

      // 🧹 cleanup
      if (listenerId !== null) {
        sdk.removeEventListener(listenerId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      reject(error);
    }
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
    const transactions = response.payments;
    if (Array.isArray(transactions)) {
      return transactions.map(item => {
        const txHash = item?.details.inner?.paymentHash || item?.id || 'N/A';
        return {
          amount: item.amount,
          link: txHash?.substring(0, 13) + '...',
          url: `${config.BITCOIN_LIGHTNING_URL}/tx/${txHash}`,
          status: item?.status ? 'Pending' : 'SUCCESS',
          date: Number(item?.timestamp) * 1000,
          from: item?.details.inner?.preimage,
          to: item?.details.inner?.destinationPubKey,
          totalCourse: '0$',
          paymentType: item.paymentType,
        };
      });
    }
    return [];
  } catch (error) {
    console.error(`error getting transactions for bitcoin lightning ${error}`);
    return [];
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
        amount: satoshiToBtc(deposit.amountSats),
        fees: satoshiToBtc(requiredFeeRate),
        receivedAmount: satoshiToBtc(amountReceive),
      });
    }
    return result;
  } catch (error) {
    console.error(`error getting transactions for bitcoin lightning ${error}`);
    return [];
  }
};

export const approveClaimDepositRequest = async (phrase, txid, vout) => {
  try {
    const sdk = await connectToSdk(phrase);
    if (!sdk) return;
    const response = await sdk.listUnclaimedDeposits({});
    const recommendedFees = await sdk.recommendedFees();
    for (const deposit of response.deposits) {
      if (
        deposit.claimError != null &&
        txid === deposit.txid &&
        vout === deposit.vout
      ) {
        if (
          deposit.claimError?.tag ===
          DepositClaimError_Tags.MaxDepositClaimFeeExceeded
        ) {
          const requiredFeeRate =
            deposit.claimError.inner.requiredFeeRateSatPerVbyte;
          console.log('requiredFeeRate:', requiredFeeRate);
          console.log(
            'recommendedFees.fastestFee:',
            recommendedFees.fastestFee,
          );
          if (requiredFeeRate <= recommendedFees.fastestFee) {
            const claimRequest = {
              txid: deposit.txid,
              vout: deposit.vout,
              maxFee: new MaxFee.Rate({satPerVbyte: requiredFeeRate}),
            };
            await sdk.claimDeposit(claimRequest);
            return true;
          }
        }
      }
    }
    return false;
  } catch (error) {
    console.error(
      `error approving deposit request for bitcoin lightning ${error}`,
    );
    return false;
  }
};

export const refundClaimRequest = async (
  phrase,
  txid,
  vout,
  destinationAddress,
) => {
  try {
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
    const response = await sdk.refundDeposit(request);
    return true;
  } catch (error) {
    console.log(JSON.stringify(error));
    console.error(`error getting transactions for bitcoin lightning ${error}`);
    return false;
  }
};
