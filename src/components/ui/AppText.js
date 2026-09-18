import React, {useContext} from 'react';
import {Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {type} from './tokens';

/**
 * Typography primitive.
 *
 * `variant` picks a size + Roboto face from the type scale; `tone` picks a
 * colour from the theme. Both have sensible defaults, so most call sites are
 * just `<AppText variant="h1">Welcome back</AppText>`.
 */
const TONES = {
  primary: theme => theme.textPrimary,
  muted: theme => theme.textMuted,
  faint: theme => theme.textFaint,
  accent: theme => theme.accentLink,
  danger: theme => theme.danger,
  onAccent: () => '#FFFFFF',
};

const AppText = ({
  variant = 'body',
  tone = 'primary',
  style,
  children,
  ...rest
}) => {
  const {theme} = useContext(ThemeContext);
  const color = (TONES[tone] || TONES.primary)(theme);

  return (
    <Text style={[type[variant] || type.body, {color}, style]} {...rest}>
      {children}
    </Text>
  );
};

export default AppText;
