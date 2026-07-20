import {InAppBrowser} from 'react-native-inappbrowser-reborn';

// InAppBrowser presents a full native view controller (SFSafariViewController
// on iOS, Chrome Custom Tab on Android). Any background transition that
// happens WHILE it is presented is self-initiated - the Android custom-tab
// presentation itself, the user tapping the in-browser "open in browser"
// button, or a home press with the browser up - and must not trigger the
// hide-wallet relock listener in components/main.js. A one-shot
// markExpectedBackground() can't model this: on iOS presenting the browser
// never fires a 'background' event, so the mark would linger and wrongly
// suppress a real background long after the browser was closed. Instead the
// suppression lives exactly as long as the browser session:
// InAppBrowser.open() resolves when the browser is dismissed (and the
// finally also covers open failures), after which any background is the
// user genuinely leaving the app.
let browserSessionActive = false;

export const isInAppBrowserSessionActive = () => browserSessionActive;

export const openInAppBrowser = async (url, options) => {
  browserSessionActive = true;
  try {
    return await InAppBrowser.open(url, options);
  } finally {
    browserSessionActive = false;
  }
};

export const isInAppBrowserAvailable = async () => {
  try {
    return await InAppBrowser.isAvailable();
  } catch (e) {
    return false;
  }
};
