import {NativeModules} from 'react-native';

let {NativeKeygen} = NativeModules;

if (!NativeKeygen) {
  NativeKeygen = NativeModules.CustomMethods;
}

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
    return await NativeKeygen.addCustomDerivation(
      chain_name,
      mnenomincs,
      derivePath,
    );
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
