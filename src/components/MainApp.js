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
import {DokApi} from 'dok-wallet-blockchain-networks/config/dokApi';
import {
  initializeDokApiIntegrity,
  setupDokApiIntegrity,
} from 'utils/apiIntegrity';
import {LocalNotificationProvider} from 'providers/LocalNotificationProvider';

// Register interceptors at module load time so they are guaranteed to be
// present before any component renders or dispatches an API call.
// (React fires children's useEffect before parents', so doing this inside
// a useEffect would leave a window where Main's effects fire unprotected.)
setupDokApiIntegrity(DokApi);

export default function MainApp() {
  const [integrityReady, setIntegrityReady] = useState(false);

  const onError = useCallback((error, stackTrace) => {
    console.error('Error in app', error.message);
    console.error('Error in app stacktrace', stackTrace);
  }, []);

  useEffect(() => {
    // Pre-warm the platform token provider (Android) / pre-register the device
    // (iOS) before allowing child components to mount and fire API calls.
    // .finally() ensures the gate opens even if initialization fails gracefully.

    initializeDokApiIntegrity().finally(() => {
      setIntegrityReady(true);
    });
  }, []);

  return (
    <LocalNotificationProvider>
      <ErrorBoundary onError={onError} FallbackComponent={ErrorComponent}>
        <Provider store={store}>
          <PaperProvider>
            <ThemeProvider>
              <SafeAreaProvider>
                {integrityReady && <Main />}
                <Toasts />
              </SafeAreaProvider>
            </ThemeProvider>
          </PaperProvider>
        </Provider>
      </ErrorBoundary>
    </LocalNotificationProvider>
  );
}
