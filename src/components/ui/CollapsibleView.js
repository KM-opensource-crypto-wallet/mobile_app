import React, {useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Folds its content away as `collapsed` goes 0 -> 1, without ever unmounting it.
 *
 * Conditionally rendering an element mid-transition makes it pop in and out;
 * this animates height (or width) to zero instead, alongside a fade and a slight
 * scale, so the surrounding layout reflows smoothly.
 *
 * The natural size is measured once on the inner view and kept there, so the
 * outer view can animate to zero and back without the measurement collapsing
 * along with it.
 *
 * Pass an explicit `size` when the content has a known fixed extent. It is
 * required for `axis="width"`: a zero-width parent constrains its child's
 * width, so the child would measure 0 and never be able to grow back. Heights
 * are not constrained that way, so they can be measured.
 *
 * `collapsed` is a SharedValue: 0 = fully shown, 1 = fully hidden.
 */
const CollapsibleView = ({
  collapsed,
  axis = 'height',
  size,
  scaleTo = 0.86,
  fade = true,
  style,
  contentStyle,
  children,
}) => {
  const natural = useSharedValue(size ?? 0);

  const onLayout = useCallback(
    event => {
      if (size != null) {
        return;
      }
      const {width, height} = event.nativeEvent.layout;
      natural.value = axis === 'width' ? width : height;
    },
    [axis, natural, size],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const shown = 1 - collapsed.value;
    const extent = natural.value * shown;
    return {
      ...(axis === 'width' ? {width: extent} : {height: extent}),
      opacity: fade ? shown : 1,
      transform: [{scale: scaleTo + (1 - scaleTo) * shown}],
    };
  });

  return (
    <Animated.View style={[styles.clip, animatedStyle, style]}>
      <View
        onLayout={onLayout}
        style={[size != null && {[axis]: size}, contentStyle]}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  clip: {overflow: 'hidden'},
});

export default CollapsibleView;
