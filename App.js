import React, {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import {
  bootstrapStorage,
  resetBootstrap,
  setBootstrapContext,
} from 'redux/storage/bootstrap';
import BootSplash from 'react-native-bootsplash';
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

  // MainApp hides the splash once the store has loaded; on a fatal bootstrap
  // it never mounts, so hide it here or StorageErrorScreen stays covered.
  useEffect(() => {
    if (status === 'fatal') {
      BootSplash.hide({fade: true}).catch(e =>
        captureError(e, {tags: {area: 'bootsplash'}}),
      );
    }
  }, [status]);

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
  // BootSplash stays up until the store reports loaded (or the fatal branch
  // above hides it), so nothing to draw.
  return <View />;
}
