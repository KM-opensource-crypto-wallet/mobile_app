import React, {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import {
  bootstrapStorage,
  resetBootstrap,
  setBootstrapContext,
} from 'redux/storage/bootstrap';
import StorageErrorScreen from 'components/StorageErrorScreen';
import {captureError} from 'services/logger';

// Loaded only once storage is ready: importing MainApp evaluates redux/store,
// whose first persisted read would otherwise race the bootstrap (the Android
// SharedPreferences migration that used to live here, and the persist:root2
// → vault migration now run inside bootstrapStorage()).
let MainApp = null;

export default function App() {
  const [status, setStatus] = useState('booting');
  const [error, setError] = useState(null);

  const boot = useCallback(() => {
    setStatus('booting');
    setBootstrapContext('foreground');
    bootstrapStorage().then(
      () => {
        if (!MainApp) {
          MainApp = require('components/MainApp').default;
        }
        setStatus('ready');
      },
      bootError => {
        captureError(bootError, {
          level: 'fatal',
          tags: {area: 'storage', op: 'bootstrap'},
        });
        setError(bootError);
        setStatus('fatal');
      },
    );
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  if (status === 'ready') {
    return <MainApp />;
  }
  if (status === 'fatal') {
    return (
      <StorageErrorScreen
        error={error}
        onRetry={() => {
          resetBootstrap();
          boot();
        }}
      />
    );
  }
  // BootSplash stays up until the store reports loaded, so nothing to draw.
  return <View />;
}
