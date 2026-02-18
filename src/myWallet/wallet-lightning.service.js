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
import {
  DocumentDirectoryPath,
  mkdir,
  writeFile,
  readFile,
  unlink,
  exists,
  stat,
} from 'react-native-fs';
import {
  convertToSmallAmount,
  parseBalance,
} from 'dok-wallet-blockchain-networks/helper';

let sdkInstance = null;
let connectingPromise = null;
let prepareSendResponse;
const sdkMap = new Map();

const debugStorageDir = async workingDir => {
  const testFilePath = `${workingDir}/test_write.txt`;
  try {
    // 1. Check if directory exists
    const dirExists = await exists(workingDir);
    console.log(`📁 [DEBUG] Directory exists: ${dirExists}`);

    // 2. Get directory stats
    if (dirExists) {
      const dirStat = await stat(workingDir);
      console.log(`📁 [DEBUG] Directory stat:`, JSON.stringify(dirStat));
    }

    // 3. Try writing a test file
    await writeFile(testFilePath, 'breez-sdk-test', 'utf8');
    console.log('📁 [DEBUG] Test file write: SUCCESS');

    // 4. Try reading the test file back
    const content = await readFile(testFilePath, 'utf8');
    console.log(`📁 [DEBUG] Test file read: SUCCESS, content="${content}"`);

    // 5. Cleanup test file
    await unlink(testFilePath);
    console.log('📁 [DEBUG] Test file cleanup: SUCCESS');

    return true;
  } catch (err) {
    console.error('📁 [DEBUG] Storage test FAILED:', err);
    return false;
  }
};

const commonConnectSdk = async mnemonic => {
  try {
    const network = IS_SANDBOX ? Network.Regtest : Network.Mainnet;
    let config = defaultConfig(network);
    config.apiKey = process.env.BREEZ_API_KEY;
    // Disable automatic claiming
    config.maxDepositClaimFee = undefined;

    console.log('📁 [DEBUG] DocumentDirectoryPath:', DocumentDirectoryPath);
    const baseDir = DocumentDirectoryPath.replace('file://', '');
    console.log('📁 [DEBUG] baseDir (after replace):', baseDir);
    const workingDir = `${baseDir}/breezSdkSpark`;
    console.log('📁 [DEBUG] workingDir:', workingDir);

    try {
      await mkdir(workingDir);
      console.log('📁 [DEBUG] mkdir: SUCCESS');
    } catch (mkdirErr) {
      console.log('📁 [DEBUG] mkdir error:', mkdirErr);
    }

    // Test if we can actually read/write to this directory
    const storageOk = await debugStorageDir(workingDir);
    console.log(`📁 [DEBUG] Storage test result: ${storageOk}`);

    const seed = new Seed.Mnemonic({mnemonic});

    console.log('📁 [DEBUG] Calling connect with storageDir:', workingDir);
    sdkInstance = await connect({
      config,
      seed,
      storageDir: workingDir,
    });
    console.log('📁 [DEBUG] connect: SUCCESS');
    sdkMap.set(mnemonic, sdkInstance);
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
        const txHash =
          item?.details.inner?.txId ||
          item?.details.inner?.paymentHash ||
          item?.id ||
          'N/A';
        return {
          amount: item.amount,
          link: txHash?.substring(0, 13) + '...',
          url: null,
          status: item?.status ? 'Pending' : 'SUCCESS',
          date: Number(item?.timestamp) * 1000,
          from: item.paymentType === 1 ? null : address,
          to: item.paymentType === 1 ? address : null,
          totalCourse: '0$',
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
