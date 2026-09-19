import React from 'react';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useKeyboardAnimation} from 'react-native-keyboard-controller';

/**
 * Spacer that grows to the keyboard height, used at the bottom of sheets and
 * lists so their last row clears the keyboard.
 *
 * Driven by the native keyboard animation instead of the previous hand-rolled
 * `keyboardWillShow` listeners, which never fired on Android and so left the
 * spacer at 0 there. The rendered output is unchanged, so the five mount sites
 * need no edits.
 */
const KeyboardHeightView = () => {
  const {height} = useKeyboardAnimation();
  const {bottom} = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(height.value - bottom, 0),
  }));

  return <Animated.View style={[styles.root, animatedStyle]} />;
};

const styles = {root: {width: '100%'}};

export default KeyboardHeightView;
