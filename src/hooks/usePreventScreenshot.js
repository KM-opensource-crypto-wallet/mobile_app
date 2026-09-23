import {useEffect} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {
  disabledPreventScreenshot,
  enablePreventScreenshot,
} from 'utils/screenshot';

// FLAG_SECURE (Android) / snapshot overlay (iOS) while the screen is focused.
// Same behaviour VerifyCreate implements inline; for screens that show or take
// secrets: seed reveal, custom derivation (private keys), login (password).
export const usePreventScreenshot = () => {
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      enablePreventScreenshot().then(() => {});
    } else {
      disabledPreventScreenshot().then(() => {});
    }
    return () => {
      disabledPreventScreenshot().then(() => {});
    };
  }, [isFocused]);
};
