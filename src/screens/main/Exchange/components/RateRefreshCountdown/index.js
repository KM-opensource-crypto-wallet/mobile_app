import React, {useContext, useEffect, useRef, useState} from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';

export const QUOTE_REFRESH_INTERVAL_MS = 60 * 1000;

// Small "↻ 24s" pill next to the provider header. Counts down from the
// last quote fetch and calls onRefresh at zero (or on tap). Pausing (while
// a request is in flight or an approval sheet is open) freezes the timer.
const RateRefreshCountdown = ({fetchedAt, paused = false, onRefresh}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!fetchedAt || paused) {
      return undefined;
    }
    const tick = () => {
      const elapsed = Date.now() - fetchedAt;
      const left = Math.ceil((QUOTE_REFRESH_INTERVAL_MS - elapsed) / 1000);
      if (left <= 0) {
        setSecondsLeft(0);
        onRefreshRef.current?.();
      } else {
        setSecondsLeft(left);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [fetchedAt, paused]);

  if (!fetchedAt) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={() => onRefreshRef.current?.()}
      hitSlop={{top: 8, left: 8, bottom: 8, right: 8}}
      accessibilityRole="button"
      accessibilityLabel="Refresh quotes now">
      <Text style={styles.text}>
        {paused || secondsLeft === null ? '↻' : `↻ ${secondsLeft}s`}
      </Text>
    </TouchableOpacity>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    pill: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
      paddingHorizontal: 10,
      paddingVertical: 3,
      minWidth: 56,
      alignItems: 'center',
    },
    text: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontVariant: ['tabular-nums'],
    },
  });

export default RateRefreshCountdown;
