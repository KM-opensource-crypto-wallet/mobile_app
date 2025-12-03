import React, { useCallback, useEffect } from 'react';
import { Provider } from 'react-redux';
import { persistor, store } from 'redux/store';
import { Provider as PaperProvider } from 'react-native-paper';
import Main from 'components/main';
import { ThemeProvider } from 'theme/ThemeContext';
import Toasts from 'components/Toasts';
import ErrorBoundary from 'react-native-error-boundary';
import ErrorComponent from 'components/ErrorComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';


export default function App() {
  const onError = useCallback((error, stackTrace) => {
    console.error('Error in app', error.message);
    console.error('Error in app stacktrace', stackTrace);
  }, []);

  // async function clearReduxPersistStorage() {
  //   try {
  //     // 1. Purge redux-persist state
  //     await persistor.purge();

  //     // 2. Clear AsyncStorage completely
  //     await AsyncStorage.clear();

  //     // 3. Flush to ensure writes finish
  //     await persistor.flush();

  //     console.log("Redux Persist + AsyncStorage cleared successfully!");
  //   } catch (error) {
  //     console.error("Failed to clear Redux Persist storage:", error);
  //   }
  // }
  // const clearStorage = async () => {
  //   await clearReduxPersistStorage()
  // }
  // useEffect(() => {
  //   clearStorage()
  // }, [])

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
