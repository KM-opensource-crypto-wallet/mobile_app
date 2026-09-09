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
import {attachDokApiLogging, captureError} from 'services/logger';

// Register interceptors at module load time so they are guaranteed to be
// present before any component renders or dispatches an API call.
// (React fires children's useEffect before parents', so doing this inside
// a useEffect would leave a window where Main's effects fire unprotected.)
// Logging is registered first: axios runs response error handlers in
// registration order, so the pre-retry integrity rejection is recorded as
// `dokapi.failed` before the integrity interceptor retries and may succeed.
attachDokApiLogging(DokApi);
setupDokApiIntegrity(DokApi);

export default function MainApp() {
  const [integrityReady, setIntegrityReady] = useState(false);

  // Render errors that reach the root boundary take the whole app down, so
  // report them as fatal with the component stack for grouping.
  const onError = useCallback((error, stackTrace) => {
    captureError(error, {
      level: 'fatal',
      tags: {boundary: 'app'},
      extra: {componentStack: stackTrace},
    });
  }, []);

  useEffect(() => {
    // Pre-warm the platform token provider (Android) / pre-register the device
    // (iOS) before allowing child components to mount and fire API calls.
    // .finally() ensures the gate opens even if initialization fails gracefully.

    const startedAt = Date.now();
    initializeDokApiIntegrity()
      .then(() => {
        console.log(
          `[integrity] MainApp: init resolved in ${Date.now() - startedAt}ms`,
        );
      })
      .catch(err => {
        console.warn(
          `[integrity] MainApp: init rejected after ${
            Date.now() - startedAt
          }ms — opening gate anyway:`,
          err?.message,
        );
      })
      .finally(() => {
        setIntegrityReady(true);
      });
  }, []);

  return (
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
  );
}
