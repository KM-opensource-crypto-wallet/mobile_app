import { useCallback } from 'react'
import { Provider } from 'react-redux'
import { store } from '../src/redux/store';
import { Provider as PaperProvider } from 'react-native-paper'
import Main from './components/main';
import { ThemeProvider } from '../src/theme/ThemeContext'
import Toast from './components/Toast'
import ErrorBoundary from 'react-native-error-boundary'
import ErrorComponent from './components/ErrorComponent';

export default function App() {
  const onError = useCallback((error: any, stackTrace: any) => {
    console.error('Error in app', error.message);
    console.error('Error in app stacktrace', stackTrace);
  }, []);

  return (
    <>
      <ErrorBoundary onError={onError} FallbackComponent={ErrorComponent}>
        <Provider store={store}>
          <PaperProvider>
            <ThemeProvider>
              <Main />
              <Toast message={"hi there"} />
            </ThemeProvider>
          </PaperProvider>
        </Provider>
      </ErrorBoundary>
    </>
  );
}
