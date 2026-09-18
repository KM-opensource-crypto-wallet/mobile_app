import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {LiquidGlassView, isLiquidGlassSupported} from '@callstack/liquid-glass';
import {ThemeContext} from 'theme/ThemeContext';
import {radius as radiusTokens} from './tokens';

/**
 * Frosted surface used by the password field and the biometric tile.
 *
 * This is the ONLY file that imports @callstack/liquid-glass. The native effect
 * is iOS 26+ only - on Android and older iOS LiquidGlassView degrades to a plain
 * View, so the translucent fill + hairline border fallback is always supplied.
 * Swapping the glass implementation later means editing this file alone.
 */
const GlassSurface = ({
  radius = radiusTokens.control,
  effect = 'regular',
  interactive = false,
  tintColor,
  style,
  children,
  ...rest
}) => {
  const {theme} = useContext(ThemeContext);

  const shape = {borderRadius: radius};
  const fallback = {
    backgroundColor: theme.glassFill,
    borderWidth: 1.5,
    borderColor: theme.glassBorder,
  };

  return (
    <LiquidGlassView
      effect={effect}
      interactive={interactive}
      tintColor={tintColor}
      style={[styles.base, shape, !isLiquidGlassSupported && fallback, style]}
      {...rest}>
      {children}
    </LiquidGlassView>
  );
};

/**
 * Non-glass counterpart for surfaces that must stay opaque (the bottom sheet
 * body). Kept here so every surface style lives in one place.
 */
export const SolidSurface = ({
  radius = radiusTokens.control,
  style,
  children,
}) => {
  const {theme} = useContext(ThemeContext);
  return (
    <View
      style={[{backgroundColor: theme.sheetBg, borderRadius: radius}, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {overflow: 'hidden'},
});

export default GlassSurface;
