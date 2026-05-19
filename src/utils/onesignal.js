import {LogLevel, OneSignal} from 'react-native-onesignal';
import {getUniqueId} from 'react-native-device-info';
import {ONESIGNAL_APP_ID} from 'utils/wlData';
import {IS_ANDROID} from 'utils/dimensions';

let _initialized = false;

export const setupOneSignal = () => {
  if (!ONESIGNAL_APP_ID || _initialized) {
    return;
  }
  if (__DEV__) {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  }
  // Android is initialized natively in MainApplication.kt via initWithContext.
  // iOS has no native init, so initialize() must be called from JS.
  OneSignal.initialize(ONESIGNAL_APP_ID);
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', event => {
    event.getNotification().display();
  });
  _initialized = true;
};

export const initOneSignal = async () => {
  if (!ONESIGNAL_APP_ID) {
    return null;
  }
  try {
    setupOneSignal();
    const deviceId = await getUniqueId();
    OneSignal.login(deviceId);
    OneSignal.User.pushSubscription.optIn();
    return await OneSignal.User.getOnesignalId();
  } catch (error) {
    console.error('OneSignal init error:', error);
    return null;
  }
};

export const logoutOneSignal = () => {
  OneSignal.logout();
};

export const addNotificationClickListener = callback => {
  OneSignal.Notifications.addEventListener('click', callback);
};

export const removeNotificationClickListener = callback => {
  OneSignal.Notifications.removeEventListener('click', callback);
};
