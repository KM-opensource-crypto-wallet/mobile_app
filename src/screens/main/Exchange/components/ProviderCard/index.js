import React, {useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ProviderCardStyles';

// One provider row: logo, name and minimum on the left; the amount you'd
// receive (with fiat value) on the right. The best rate gets a badge,
// others show how far behind they are. Rows the entered amount doesn't
// qualify for are greyed out and disabled, with the minimum highlighted so
// the user knows what amount would unlock them.
const ProviderCard = ({row, fromSymbol, toSymbol, fiatSymbol, onPress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const disabled = row.isBelowMinimum || !row.toAmount;
  const minText = row.minAmount
    ? `Min ${row.minAmount} ${fromSymbol || ''}${
        row.minAmountFiat ? ` (~${fiatSymbol}${row.minAmountFiat})` : ''
      }`
    : 'No minimum reported';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        row.isSelected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
      disabled={disabled}
      onPress={() => onPress?.(row)}
      accessibilityRole="button"
      accessibilityState={{disabled, selected: row.isSelected}}>
      <View style={styles.logoBox}>
        {!!row.src && (
          <FastImage
            source={{uri: row.src}}
            resizeMode={'contain'}
            style={styles.logo}
          />
        )}
      </View>
      <View style={styles.infoBox}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {row.title}
          </Text>
          {row.isBest && (
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>BEST RATE</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.minText, row.isBelowMinimum && styles.minTextWarning]}
          numberOfLines={1}>
          {minText}
        </Text>
      </View>
      <View style={styles.amountBox}>
        {row.toAmount ? (
          <>
            <Text style={styles.amountText} numberOfLines={1}>
              {`${row.toAmount} ${toSymbol || ''}`}
            </Text>
            {!!row.toAmountFiat && (
              <Text style={styles.amountFiat} numberOfLines={1}>
                {`~${fiatSymbol}${row.toAmountFiat}`}
              </Text>
            )}
            {!!row.percentDiffFromBest && (
              <Text style={styles.percentDiff}>
                {`${row.percentDiffFromBest}%`}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.amountUnavailable}>
            {row.isBelowMinimum ? 'Amount too low' : 'No quote'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ProviderCard;
