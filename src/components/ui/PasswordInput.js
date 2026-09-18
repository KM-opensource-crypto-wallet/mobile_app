import React, {forwardRef, useContext, useState} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {ThemeContext} from 'theme/ThemeContext';
import AppTextInput from './AppTextInput';
import {radius} from './tokens';

/**
 * Password field with the show/hide toggle built in.
 *
 * The `hide` state + eye/eye-off TextInput.Icon block is currently copy-pasted
 * across 6 files; this is the single implementation new code should use.
 */
const PasswordInput = forwardRef(({...rest}, ref) => {
  const {theme} = useContext(ThemeContext);
  const [hidden, setHidden] = useState(true);

  return (
    <AppTextInput
      ref={ref}
      secureTextEntry={hidden}
      autoCapitalize="none"
      autoCorrect={false}
      placeholder="Password"
      right={
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          onPress={() => setHidden(h => !h)}
          style={styles.toggle}>
          <Icon
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={theme.textMuted}
          />
        </TouchableOpacity>
      }
      {...rest}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  toggle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
});

export default PasswordInput;
