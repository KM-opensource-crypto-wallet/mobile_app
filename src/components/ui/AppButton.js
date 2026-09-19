import React, {useContext} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import AppText from './AppText';
import {controlHeight, radius, spacing} from './tokens';

/**
 * The app's button primitive.
 *
 * Replaces the `<TouchableOpacity style={styles.button}><Text
 * style={styles.buttonTitle}>` idiom that ~87 files currently redeclare, and
 * adds the loading state the design needs ("Unlocking...") which no existing
 * button had.
 *
 * Gradient fills use `experimental_backgroundImage`, matching GradientBackground.
 */
const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  children,
  ...rest
}) => {
  const {theme} = useContext(ThemeContext);
  const isDisabled = disabled || loading;

  const gradient = (top, bottom) => ({
    backgroundColor: bottom,
    experimental_backgroundImage: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`,
  });

  const VARIANTS = {
    primary: {
      container: gradient(theme.accentTop, theme.background),
      tone: 'onAccent',
    },
    destructive: {
      container: gradient(theme.dangerTop, theme.danger),
      tone: 'onAccent',
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.sheetBorder,
      },
      tone: 'primary',
    },
    link: {
      container: {backgroundColor: 'transparent', height: undefined},
      tone: 'accent',
    },
  };

  let {container, tone} = VARIANTS[variant] || VARIANTS.primary;
  const isLink = variant === 'link';

  // A disabled filled button gets the design's muted surface rather than a
  // faded gradient, which otherwise reads as a washed-out version of the
  // destructive red.
  if (isDisabled && !isLink && variant !== 'secondary') {
    container = {backgroundColor: theme.disabledSurface};
    tone = 'disabled';
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: loading}}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        isLink ? styles.link : styles.base,
        container,
        isDisabled && isLink && styles.disabledLink,
        style,
      ]}
      {...rest}>
      {loading && (
        <ActivityIndicator
          size="small"
          color="#FFFFFF"
          style={styles.spinner}
        />
      )}
      {title ? (
        <AppText
          variant={isLink ? 'bodyStrong' : 'button'}
          tone={tone}
          style={textStyle}>
          {title}
        </AppText>
      ) : null}
      {children ? <View style={styles.slot}>{children}</View> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: controlHeight,
    borderRadius: radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  disabledLink: {opacity: 0.5},
  spinner: {marginRight: spacing.xs},
  slot: {marginLeft: spacing.sm},
});

export default AppButton;
