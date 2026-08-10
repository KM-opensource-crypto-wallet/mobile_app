import ScreenGuardModule from 'react-native-screenguard';
import screen_prevent from 'assets/images/screenshot_prevent.png';
import {IS_ANDROID} from 'utils/dimensions';

export const enablePreventScreenshot = async () => {
  try {
    if (IS_ANDROID) {
      // Android: FLAG_SECURE only. This blocks screenshots and screen
      // recording without launching ScreenGuardColorActivity (a second
      // ReactActivity), which otherwise races MainActivity's lifecycle and
      // crashes RN with "Pausing an activity that is not the current activity".
      await ScreenGuardModule.registerWithoutEffect();
      return;
    }
    // iOS has no FLAG_SECURE, so it needs the overlay image to obscure the
    // app snapshot, and it isn't affected by the Android multi-activity crash.
    const dataRequire = {
      height: 668,
      width: 375,
      source: screen_prevent,
      backgroundColor: 'white',
    };
    await ScreenGuardModule.registerWithImage(dataRequire);
  } catch (error) {
    console.error('error in enablePreventScreenshot', error);
  }
};

export const disabledPreventScreenshot = async () => {
  try {
    await ScreenGuardModule.unregister();
  } catch (error) {
    console.error('error in disabledPreventScreenshot', error);
  }
};
