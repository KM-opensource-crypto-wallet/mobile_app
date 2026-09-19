import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {ThemeContext} from 'theme/ThemeContext';
import {withAlpha} from './color';

/**
 * Full-bleed screen background: the design's 165deg gradient plus the radial
 * brand glow.
 *
 * This is the ONLY file that touches `experimental_backgroundImage`. React
 * Native 0.86 parses CSS linear-gradient / radial-gradient natively on the New
 * Architecture (enabled in this app), so no gradient library is needed. When a
 * future RN drops the `experimental_` prefix, it changes here and nowhere else.
 *
 * `progress` is an optional SharedValue (0 -> 1) that moves the glow to the
 * design's keyboard-open position. It is animated as a transform rather than by
 * changing top/width/height, because the glow's borderRadius and marginLeft are
 * derived from its size - a transform is both the cheaper and the only
 * animatable path. Without it the glow is static.
 */

// Straight from the design: a 460px circle at y=140, shrinking to 420px at y=60
// once the keyboard is up.
const GLOW = {top: 140, size: 460};
const GLOW_COMPACT = {top: 60, size: 420};

const GLOW_SHIFT = GLOW_COMPACT.top - GLOW.top; // -80
const GLOW_SCALE = GLOW_COMPACT.size / GLOW.size; // ~0.913

const GradientBackground = ({glow = true, progress, style, children}) => {
  const {theme} = useContext(ThemeContext);
  const [from, via, to] = theme.bgGradient;

  // The glow must fade out within the brand hue. The CSS keyword `transparent`
  // is transparent *black*, so interpolating to it drags the midtones through
  // grey and the bloom reads as a dirty smudge rather than a clean tint.
  const glowFrom = theme.accentGlow;
  const glowTo = withAlpha(theme.background, 0);

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const value = progress ? progress.value : 0;
    return {
      transform: [
        {translateY: GLOW_SHIFT * value},
        {scale: 1 + (GLOW_SCALE - 1) * value},
      ],
    };
  });

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: from,
          experimental_backgroundImage: `linear-gradient(165deg, ${from} 0%, ${via} 55%, ${to} 100%)`,
        },
        style,
      ]}>
      {glow && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              experimental_backgroundImage: `radial-gradient(circle, ${glowFrom} 0%, ${glowTo} 65%)`,
            },
            glowAnimatedStyle,
          ]}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, overflow: 'hidden'},
  glow: {
    position: 'absolute',
    left: '50%',
    top: GLOW.top,
    width: GLOW.size,
    height: GLOW.size,
    marginLeft: -GLOW.size / 2,
    borderRadius: GLOW.size / 2,
  },
});

export default GradientBackground;
