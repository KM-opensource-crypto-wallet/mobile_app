import React, {useCallback, useEffect, useState} from 'react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';
import {Provider as PaperProvider} from 'react-native-paper';
import Main from 'components/main';
import {ThemeProvider} from 'theme/ThemeContext';
import Toasts from 'components/Toasts';
import ErrorBoundary from 'react-native-error-boundary';
import ErrorComponent from 'components/ErrorComponent';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {IS_ANDROID} from 'utils/dimensions';
import {NativeModules, View} from 'react-native';
import {getAsyncStorageData, storeAsyncStorageData} from 'utils/asyncStorage';
import {setItem} from 'react-native-sensitive-info';

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
          const SensitiveInfo = NativeModules.SensitiveInfo;
          const sharedPreference = process.env.REDUX_SHARED_PREFERENCE_NAME;
          const reduxKey = process.env.REDUX_KEY;
          const oldData = await SensitiveInfo.getLegacySecureValue(
            sharedPreference,
            reduxKey,
          );
          await setItem(reduxKey, oldData, {
            accessControl: 'none',
          });
          await NativeModules.clearLegacySecureStorage(sharedPreference);
          await storeAsyncStorageData('sensitive_info_migration', 'true');
        }
      }
    })();
  }, []);

  const onError = useCallback((error, stackTrace) => {
    console.error('Error in app', error.message);
    console.error('Error in app stacktrace', stackTrace);
  }, []);

  if (isMigrating) {
    return <View />;
  }

  return (
    <ErrorBoundary onError={onError} FallbackComponent={ErrorComponent}>
      <Provider store={store}>
        <PaperProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <Main />
              <Toasts />
            </SafeAreaProvider>
          </ThemeProvider>
        </PaperProvider>
      </Provider>
    </ErrorBoundary>
  );
}
