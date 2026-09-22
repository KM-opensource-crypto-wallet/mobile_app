// Copy for the OS biometric prompt shown by react-native-sensitive-info when
// the biometric-bound DEK item is read (unlock) and, on Android, written
// (enable). secureStore.js maps the shape per platform (iOS: `description`).
import {WL_APP_NAME} from 'utils/wlData';

export const BIOMETRIC_PROMPT = Object.freeze({
  title: `Unlock ${WL_APP_NAME}`,
  subtitle: 'Confirm with biometrics to open your wallet',
});
