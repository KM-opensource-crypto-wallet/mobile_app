import React, {useEffect} from 'react';
import {Keyboard} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {IS_IOS} from 'utils/dimensions';

const KeyboardHeightView = () => {
  const height = useSharedValue(0);
  const {bottom} = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, event => {
      height.value = withTiming(event.endCoordinates.height - bottom, {
        duration: event.duration,
      });
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, event => {
      height.value = withTiming(0, {duration: event.duration});
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottom]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[{width: '100%'}, animatedStyle]} />;
};

export default KeyboardHeightView;
