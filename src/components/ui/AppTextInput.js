import React, {forwardRef, useContext, useEffect} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {ThemeContext} from 'theme/ThemeContext';
import AppText from './AppText';
import {withAlpha} from './color';
import {controlHeight, radius, spacing, type} from './tokens';

/**
 * Text field primitive.
 *
 * Built on React Native's TextInput rather than react-native-paper's: the
 * design's field is a single row with a trailing adornment, which Paper's
 * `mode="outlined"` cannot express. 35 files currently re-specify the same ~10
 * Paper theming props by hand - new screens should use this instead.
 *
 * The field is deliberately a solid surface rather than GlassSurface: real
 * liquid glass samples the warm background gradient, which tints the field
 * cream instead of white.
 *
 * `surface`: 'screen' (on the gradient, as on Login) or 'sheet' (inside a
 * bottom sheet, which has its own background).
 *
 * `InputComponent` swaps the underlying input - pass gorhom's
 * BottomSheetTextInput when the field lives inside a bottom sheet, which needs
 * it to track focus and keyboard height.
 */
const AppTextInput = forwardRef(
  (
    {
      label,
      error,
      right,
      surface = 'screen',
      InputComponent = TextInput,
      containerStyle,
      inputStyle,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const {theme} = useContext(ThemeContext);
    // 0 = resting, 1 = focused. Animated so the ring eases in rather than
    // snapping between two style objects.
    const focus = useSharedValue(0);

    const restingBorder =
      surface === 'sheet' ? theme.sheetBorder : theme.inputBorder;
    const activeBorder = withAlpha(theme.background, 0.55);

    const fill =
      surface === 'sheet'
        ? {backgroundColor: theme.sheetInputBg}
        : {backgroundColor: theme.inputFill};

    useEffect(() => {
      if (error) {
        focus.value = withTiming(0, ANIMATION);
      }
    }, [error, focus]);

    const ringStyle = useAnimatedStyle(() => ({
      borderColor: error
        ? theme.danger
        : interpolateColor(focus.value, [0, 1], [restingBorder, activeBorder]),
      shadowOpacity: error ? 0 : focus.value * 0.18,
    }));

    const row = (
      <View style={styles.row}>
        <InputComponent
          ref={ref}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, {color: theme.textPrimary}, inputStyle]}
          onFocus={e => {
            focus.value = withTiming(1, ANIMATION);
            onFocus?.(e);
          }}
          onBlur={e => {
            focus.value = withTiming(0, ANIMATION);
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
        <Animated.View
          style={[
            styles.field,
            fill,
            {shadowColor: theme.background},
            ringStyle,
          ]}>
          {row}
        </Animated.View>
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

const ANIMATION = {duration: 250, easing: Easing.ease};

const styles = StyleSheet.create({
  field: {
    height: controlHeight,
    justifyContent: 'center',
    borderRadius: radius.control,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 0},
  },
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
