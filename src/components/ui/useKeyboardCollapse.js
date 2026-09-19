import {useEffect} from 'react';
import {useReanimatedKeyboardAnimation} from 'react-native-keyboard-controller';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Keyboard progress for a screen that should ignore keyboards it does not own.
 *
 * Returns a `collapse` SharedValue (0 = keyboard closed, 1 = fully open). Pass
 * `suppressed: true` while something layered over the screen owns the keyboard -
 * a bottom sheet with its own field, say - and `collapse` stays at 0 so the
 * screen underneath does not reshape itself.
 *
 * Built on `useReanimatedKeyboardAnimation` rather than keyboardWillShow /
 * keyboardWillHide listeners: it is fed by the same native pre-animation
 * callbacks but exposes a continuous value on the UI thread, so the layout
 * tracks the keyboard frame by frame (including an interactive swipe-dismiss)
 * and behaves identically on Android, where the `will*` events never fire.
 */
export function useKeyboardCollapse({suppressed = false} = {}) {
  const {progress} = useReanimatedKeyboardAnimation();
  const wantSuppressed = useSharedValue(suppressed ? 1 : 0);
  const active = useSharedValue(1);

  useEffect(() => {
    wantSuppressed.value = suppressed ? 1 : 0;
  }, [suppressed, wantSuppressed]);

  // `active` only ever flips while the keyboard is fully down. Toggling it
  // mid-animation would make `collapse` jump by whatever the keyboard had
  // already travelled, which is exactly the hitch you get from latching
  // ownership in a JS-thread onFocus callback: the keyboard starts moving on
  // the UI thread a frame or two before JS can say "this one is mine".
  useAnimatedReaction(
    () => ({value: progress.value, suppress: wantSuppressed.value}),
    ({value, suppress}) => {
      if (value === 0) {
        active.value = suppress ? 0 : 1;
      }
    },
  );

  const collapse = useDerivedValue(() => active.value * progress.value);

  return {collapse};
}
