import React, {useContext} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';

const CHIPS = [
  {label: '25%', fraction: 0.25},
  {label: '50%', fraction: 0.5},
  {label: 'MAX', fraction: 1},
];

// Quick-amount chips under the pay amount; each sets a fraction of the
// available balance.
const AmountChips = ({onSelectFraction, disabled = false}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View style={styles.row}>
      {CHIPS.map(chip => (
        <TouchableOpacity
          key={chip.label}
          style={[styles.chip, disabled && styles.chipDisabled]}
          disabled={disabled}
          onPress={() => onSelectFraction?.(chip.fraction)}
          accessibilityRole="button"
          accessibilityLabel={`Use ${chip.label} of balance`}>
          <Text style={styles.chipText}>{chip.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginTop: 12,
      // Keeps the chips clear of the flip button, which overlaps ~22pt into
      // the bottom of this card.
      marginBottom: 10,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
      backgroundColor: theme.backgroundColor,
      marginRight: 8,
      minHeight: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipDisabled: {
      opacity: 0.4,
    },
    chipText: {
      color: theme.font,
      fontSize: 12,
      fontFamily: 'Roboto-Bold',
    },
  });

export default AmountChips;
