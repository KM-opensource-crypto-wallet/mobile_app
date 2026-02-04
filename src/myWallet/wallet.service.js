import * as bitcoin from 'bitcoinjs-lib';
import {NativeModules} from 'react-native';
import * as bip39 from 'bip39';
import {BIP32Factory} from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';
import {IS_SANDBOX} from 'dok-wallet-blockchain-networks/config/config';
let {NativeKeygen} = NativeModules;

if (!NativeKeygen) {
  NativeKeygen = NativeModules.CustomMethods;
}

const mainNetworkKeys = {
  bitcoin: {
    public: 0x04b24746,
    private: 0x04b2430c,
  },
  bitcoin_segwit: {
    public: 0x049d7cb2,
    private: 0x049d7878,
  },
  bitcoin_legacy: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
};

const testnetNetworkKeys = {
  bitcoin: {
    public: 0x045f1cf6,
    private: 0x045f18bc,
  },
  bitcoin_segwit: {
    public: 0x044a5262,
    private: 0x044a4e28,
  },
  bitcoin_legacy: {
    public: 0x043587cf,
    private: 0x04358394,
  },
};

const getNetworkByChainName = chain_name => {
  return chain_name === 'bitcoin' && IS_SANDBOX
    ? Object.assign({}, bitcoin.networks.testnet, {
        bip32: testnetNetworkKeys.bitcoin,
      })
    : chain_name === 'bitcoin'
    ? Object.assign({}, bitcoin.networks.bitcoin, {
        bip32: mainNetworkKeys.bitcoin,
      })
    : chain_name === 'bitcoin_legacy' && IS_SANDBOX
    ? Object.assign({}, bitcoin.networks.testnet, {
        bip32: testnetNetworkKeys.bitcoin_legacy,
      })
    : chain_name === 'bitcoin_legacy'
    ? Object.assign({}, bitcoin.networks.bitcoin, {
        bip32: mainNetworkKeys.bitcoin_legacy,
      })
    : chain_name === 'bitcoin_segwit' && IS_SANDBOX
    ? Object.assign({}, bitcoin.networks.testnet, {
        bip32: testnetNetworkKeys.bitcoin_segwit,
      })
    : chain_name === 'bitcoin_segwit'
    ? Object.assign({}, bitcoin.networks.bitcoin, {
        bip32: mainNetworkKeys.bitcoin_segwit,
      })
    : '';
};

export const generateMnemonics = async () => {
  try {
    const phrase = await NativeKeygen.generateMnemonic();
    return {
      mnemonic: {
        phrase,
      },
    };
  } catch (e) {
    console.error('Failed to generate mnemonic:', e);
    throw e;
  }
};

export const createWallet = async (chain_name, phrase, isSandbox) => {
  try {
    return await NativeKeygen.getWallet(chain_name, phrase, isSandbox);
  } catch (e) {
    console.error(
      'Failed to create Wallet with chain: ',
      chain_name,
      ' ',
      isSandbox,
      ' ',
      e,
    );
    throw e;
  }
};

export const addDeriveAddresses = async (chain_name, mnenomincs) => {
  try {
    return await NativeKeygen.getDeriveAddresses(chain_name, mnenomincs, false);
  } catch (e) {
    console.error('Failed to create Wallet with chain: ', chain_name, ' ', e);
    throw e;
  }
};

export const addCustomDeriveAddressToWallet = async (
  chain_name,
  mnenomincs,
  derivePath,
) => {
  try {
    let data = {};
    let child1 = {};
    if (chain_name === 'bitcoin_legacy') {
      const customNetwork = getNetworkByChainName(chain_name);
      const seed = bip39.mnemonicToSeedSync(mnenomincs);
      const bip32 = BIP32Factory(ecc);
      const root = bip32.fromSeed(seed, customNetwork);
      child1 = root.derivePath(derivePath);
      data = bitcoin.payments.p2pkh({
        pubkey: child1.publicKey,
        network: customNetwork,
      });
    } else if (chain_name === 'bitcoin_segwit') {
      const customNetwork = getNetworkByChainName(chain_name);
      const seed = bip39.mnemonicToSeedSync(mnenomincs);
      const bip32 = BIP32Factory(ecc);
      const root = bip32.fromSeed(seed, customNetwork);
      child1 = root.derivePath(derivePath);
      const p2wpkh = bitcoin.payments.p2wpkh({
        pubkey: child1.publicKey,
        network: customNetwork,
      });
      data = bitcoin.payments.p2sh({
        redeem: p2wpkh,
      });
    } else {
      return await NativeKeygen.addCustomDerivation(
        chain_name,
        mnenomincs,
        derivePath,
      );
    }
    return {
      account: {
        privateKey: child1.toWIF(),
        address: data.address,
        derivePath: derivePath,
      },
    };
  } catch (e) {
    console.error('Failed to add custom derivation: ', chain_name, ' ', e);
    throw e;
  }
};

// this method only for android for sensitive-info-migration
export const getLegacySecureValue = async (sharedPreference, key) => {
  try {
    return await NativeKeygen.getLegacySecureValue(sharedPreference, key);
  } catch (e) {
    console.error('Failed to getLegacySecureValue: ', e);
    throw e;
  }
};
// this method only for android for sensitive-info-migration
export const clearLegacySecureStorage = async sharedPreference => {
  try {
    return await NativeKeygen.clearLegacySecureStorage(sharedPreference);
  } catch (e) {
    console.error('Failed to clearLegacySecureStorage: ', e);
    throw e;
  }
};
