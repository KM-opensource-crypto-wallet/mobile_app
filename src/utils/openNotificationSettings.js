import {openSettings} from 'react-native-permissions';
import {markExpectedBackground} from 'utils/expectedBackground';

/**
 * Deep-link to this app's notification settings: the app's notification page
 * on Android, and the app's Notifications page (iOS 15.4+) or app settings on
 * iOS. Marks the resulting background transition as expected so the
 * hide-wallet relock does not treat the round trip as the user leaving.
 */
export const openAppNotificationSettings = () => {
  markExpectedBackground();
  return openSettings('notifications');
};
