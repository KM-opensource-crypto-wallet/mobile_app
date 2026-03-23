import React, {useEffect, useState} from 'react';
import {IS_ANDROID} from 'utils/dimensions';
import {View} from 'react-native';
import {getAsyncStorageData, storeAsyncStorageData} from 'utils/asyncStorage';
import {setItem} from 'react-native-sensitive-info';
import MainApp from 'components/MainApp';
import {
  clearLegacySecureStorage,
  getLegacySecureValue,
} from 'myWallet/wallet.service';
import {registerShowToast} from 'dok-wallet-blockchain-networks/helper/toast';
import Toast from 'react-native-toast-message';

registerShowToast(({type, props, visibilityTime, autoHide}) =>
  Toast.show({type, props, visibilityTime, autoHide}),
);

export default function App() {
  const [isMigrating, setIsMigrating] = useState(IS_ANDROID);

  useEffect(() => {
    (async () => {
      if (IS_ANDROID) {
        const isMigrationDone = await getAsyncStorageData(
          'sensitive_info_migration',
        );
        if (isMigrationDone === 'true') {
          setIsMigrating(false);
        } else {
          console.log('migration started');
          const sharedPreference = process.env.REDUX_SHARED_PREFERENCE_NAME;
          const reduxKey = `persist:${process.env.REDUX_KEY}`;
          let oldData = await getLegacySecureValue(sharedPreference, reduxKey);
          if (oldData) {
            await setItem(reduxKey, oldData, {
              accessControl: 'none',
              keychainService: process.env.REDUX_KEYCHAIN_NAME,
            });
            console.log('migration saved');
            await clearLegacySecureStorage(sharedPreference);
            console.log('migration completed');
          }
          await storeAsyncStorageData('sensitive_info_migration', 'true');
          setIsMigrating(false);
        }
      }
    })();
  }, []);

  if (isMigrating) {
    return <View />;
  }

  return <MainApp />;
}
