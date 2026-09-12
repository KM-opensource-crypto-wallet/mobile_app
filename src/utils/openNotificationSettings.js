import {openSettings} from 'react-native-permissions';
import {
  consumeExpectedBackground,
  markExpectedBackground,
} from 'utils/expectedBackground';

/**
 * Deep-link to this app's notification settings: the app's notification page
 * on Android, and the app's Notifications page (iOS 15.4+) or app settings on
 * iOS. Marks the resulting background transition as expected so the
 * hide-wallet relock does not treat the round trip as the user leaving. If
 * the launch fails no background follows, so the marker is taken back —
 * otherwise it would excuse the user's next real switch away.
 */
export const openAppNotificationSettings = () => {
  markExpectedBackground();
  return openSettings('notifications').catch(e => {
    consumeExpectedBackground();
    throw e;
  });
};
