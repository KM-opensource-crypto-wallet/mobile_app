import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';

/**
 * Full-bleed screen background: the design's 165deg gradient plus an optional
 * radial brand glow.
 *
 * This is the ONLY file that touches `experimental_backgroundImage`. React
 * Native 0.86 parses CSS linear-gradient / radial-gradient natively on the New
 * Architecture (enabled in this app), so no gradient library is needed. When a
 * future RN drops the `experimental_` prefix, it changes here and nowhere else.
 */
const GradientBackground = ({
  glow = true,
  glowTop = 140,
  glowSize = 460,
  style,
  children,
}) => {
  const {theme} = useContext(ThemeContext);
  const [from, via, to] = theme.bgGradient;

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
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              top: glowTop,
              width: glowSize,
              height: glowSize,
              marginLeft: -glowSize / 2,
              borderRadius: glowSize / 2,
              experimental_backgroundImage: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 65%)`,
            },
          ]}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, overflow: 'hidden'},
  glow: {position: 'absolute', left: '50%'},
});

export default GradientBackground;
