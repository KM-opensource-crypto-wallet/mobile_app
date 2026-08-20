import React, {useContext} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import ScurvedIcon from 'assets/images/icons/S-curved.svg';
import {ThemeContext} from 'theme/ThemeContext';

// Circular button overlapping the seam between the two swap cards; swaps
// the from/to sides (coins AND amounts).
const FlipButton = ({onPress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        hitSlop={{top: 8, left: 8, bottom: 8, right: 8}}
        accessibilityRole="button"
        accessibilityLabel="Swap the pay and receive coins">
        <ScurvedIcon width={22} height={18} stroke={theme.background} />
      </TouchableOpacity>
    </View>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      marginVertical: -14,
      zIndex: 2,
    },
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.backgroundColor,
      borderWidth: 4,
      borderColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: {width: 0, height: 2},
    },
  });

export default FlipButton;
