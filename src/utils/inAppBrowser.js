import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {
  markExpectedBackground,
  consumeExpectedBackground,
} from 'utils/expectedBackground';

// InAppBrowser presents a full native view controller (SFSafariViewController
// on iOS, Chrome Custom Tab on Android), which still transitions the app
// through the OS's background/inactive lifecycle just like leaving to a
// separate app - so every caller needs the same expected-background mark
// Linking.openURL callers already get, or the hide-wallet relock listener
// in components/main.js will incorrectly treat it as the user leaving.
export const openInAppBrowser = async (url, options) => {
  markExpectedBackground();
  try {
    return await InAppBrowser.open(url, options);
  } catch (e) {
    // Open failed before the OS ever backgrounded the app for it - clear the
    // mark so it doesn't wrongly suppress the relock listener on some later,
    // unrelated background transition.
    consumeExpectedBackground();
    throw e;
  }
};
