import React, {forwardRef, useContext, useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import AppText from './AppText';
import GlassSurface from './GlassSurface';
import {withAlpha} from './color';
import {controlHeight, radius, spacing, type} from './tokens';

/**
 * Text field primitive.
 *
 * Built on React Native's TextInput rather than react-native-paper's: the
 * design's field is a frosted row with a trailing adornment, which Paper's
 * `mode="outlined"` cannot express. 35 files currently re-specify the same ~10
 * Paper theming props by hand - new screens should use this instead.
 *
 * `surface`: 'glass' (on a gradient, as on Login) or 'solid' (inside a sheet).
 */
const AppTextInput = forwardRef(
  (
    {
      label,
      error,
      right,
      surface = 'glass',
      containerStyle,
      inputStyle,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const {theme} = useContext(ThemeContext);
    const [focused, setFocused] = useState(false);

    const focusRing = error
      ? {
          borderColor: theme.danger,
          borderWidth: 1.5,
        }
      : focused
      ? {
          borderColor: withAlpha(theme.background, 0.55),
          borderWidth: 1.5,
          shadowColor: theme.background,
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 0},
        }
      : null;

    const row = (
      <View style={styles.row}>
        <TextInput
          ref={ref}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, {color: theme.textPrimary}, inputStyle]}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {right ? <View style={styles.adornment}>{right}</View> : null}
      </View>
    );

    return (
      <View style={containerStyle}>
        {label ? (
          <AppText variant="overline" tone="faint" style={styles.label}>
            {label}
          </AppText>
        ) : null}
        {surface === 'glass' ? (
          <GlassSurface style={[styles.field, focusRing]}>{row}</GlassSurface>
        ) : (
          <View
            style={[
              styles.field,
              styles.solid,
              {
                backgroundColor: theme.sheetInputBg,
                borderColor: theme.sheetBorder,
              },
              focusRing,
            ]}>
            {row}
          </View>
        )}
        {error ? (
          <AppText variant="label" tone="danger" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

AppTextInput.displayName = 'AppTextInput';

const styles = StyleSheet.create({
  field: {height: controlHeight, justifyContent: 'center'},
  solid: {borderRadius: radius.control, borderWidth: 1.5},
  row: {flexDirection: 'row', alignItems: 'center', height: '100%'},
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingHorizontal: spacing.lg,
    ...type.input,
  },
  adornment: {paddingRight: spacing.xs},
  label: {marginBottom: spacing.sm, marginLeft: spacing.xs},
  error: {marginTop: spacing.xs, marginLeft: spacing.xs},
});

export default AppTextInput;
