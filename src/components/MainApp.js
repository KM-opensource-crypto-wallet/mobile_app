import React, {useCallback, useEffect} from 'react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';
import {Provider as PaperProvider} from 'react-native-paper';
import Main from 'components/main';
import {ThemeProvider} from 'theme/ThemeContext';
import Toasts from 'components/Toasts';
import ErrorBoundary from 'react-native-error-boundary';
import ErrorComponent from 'components/ErrorComponent';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {DokApi} from 'dok-wallet-blockchain-networks/config/dokApi';
import {
  initializeDokApiIntegrity,
  setupDokApiIntegrity,
} from 'utils/apiIntegrity';

export default function MainApp() {
  const onError = useCallback((error, stackTrace) => {
    console.error('Error in app', error.message);
    console.error('Error in app stacktrace', stackTrace);
  }, []);

  useEffect(() => {
    setupDokApiIntegrity(DokApi);
    initializeDokApiIntegrity();
  }, []);

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
