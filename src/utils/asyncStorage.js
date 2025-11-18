import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeAsyncStorageData = async (key, value) => {
  try {
    return await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error('error in store data');
    // saving error
  }
};

export const getAsyncStorageData = async key => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error('error in get data');
    // saving error
  }
};

export const clearWalletConnectStorageCache = async key => {
  try {
    const allKeys = await AsyncStorage.getAllKeys(key);
    const walletConnectKeys = allKeys.filter(item => item.startsWith('wc@2'));
    await AsyncStorage.multiRemove(walletConnectKeys);
  } catch (e) {
    console.error('error in clearWalletConnectStorageCache');
  }
};
