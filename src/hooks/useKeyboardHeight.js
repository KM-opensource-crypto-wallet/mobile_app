import {useKeyboardState} from 'react-native-keyboard-controller';

/**
 * Current keyboard height in points, or 0 when hidden.
 *
 * Backed by react-native-keyboard-controller rather than raw
 * `Keyboard.addListener('keyboardDidShow')`: the native module reports the
 * height in sync with the keyboard animation and reports it correctly on
 * Android, where the app no longer resizes its window (see the KeyboardProvider
 * in components/MainApp.js).
 *
 * The signature is unchanged - a plain number - so all existing consumers keep
 * working untouched.
 */
export function useKeyboardHeight() {
  return useKeyboardState(state => state.height);
}
