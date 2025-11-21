import ScreenGuardModule from 'react-native-screenguard';
import screen_prevent from 'assets/images/screenshot_prevent.png';

export const enablePreventScreenshot = async () => {
  try {
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
