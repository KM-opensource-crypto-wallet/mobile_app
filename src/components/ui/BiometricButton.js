import React, {useContext, useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import BiometricGlyph from './BiometricGlyph';
import GlassSurface from './GlassSurface';
import {withAlpha} from './color';
import {controlHeight, radius} from './tokens';

const HERO_SIZE = 112;

/**
 * The biometric unlock affordance.
 *
 * `size="hero"` is the 112pt frosted tile from the design; `size="compact"` is
 * the 56pt square that sits beside the password field once the keyboard is up.
 * `state` drives the visuals: idle glyph, a rotating ring while scanning, a
 * green check on success.
 *
 * `type` is the device's real biometry ('faceid' | 'touchid'), so a Touch ID
 * phone does not show a Face ID glyph.
 */
const BiometricButton = ({
  onPress,
  state = 'idle',
  size = 'hero',
  type = 'faceid',
}) => {
  const {theme} = useContext(ThemeContext);
  const spin = useRef(new Animated.Value(0)).current;
  const isHero = size === 'hero';
  const scanning = state === 'scanning';
  const success = state === 'success';

  useEffect(() => {
    if (!scanning) {
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [scanning, spin]);

  const glyphSize = isHero ? 52 : 26;
  const glyphColor = scanning
    ? withAlpha(theme.accentLink, 0.45)
    : theme.accentLink;

  const content = success ? (
    <Icon name="check" size={glyphSize} color={theme.positive} />
  ) : (
    <BiometricGlyph type={type} size={glyphSize} color={glyphColor} />
  );

  const ring = scanning && (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          borderRadius: (isHero ? HERO_SIZE : controlHeight) / 2 + 7,
          borderColor: withAlpha(theme.background, 0.2),
          borderTopColor: theme.accentLink,
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    />
  );

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Unlock with biometrics"
      activeOpacity={0.85}
      onPress={onPress}
      disabled={scanning || success}>
      <View>
        <GlassSurface
          interactive
          radius={isHero ? radius.tile : radius.control}
          style={[
            styles.surface,
            isHero
              ? {width: HERO_SIZE, height: HERO_SIZE}
              : {width: controlHeight, height: controlHeight},
            isHero && styles.heroShadow,
            isHero && {shadowColor: theme.background},
          ]}>
          {content}
        </GlassSurface>
        {ring}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  surface: {alignItems: 'center', justifyContent: 'center'},
  heroShadow: {
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 16},
    elevation: 6,
  },
  ring: {
    position: 'absolute',
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    borderWidth: 3,
  },
});

export default BiometricButton;
