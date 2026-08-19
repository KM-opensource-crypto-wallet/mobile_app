import React, {useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import ArrowDown from 'assets/images/buy/arrow-down.svg';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './CoinSelectorTriggerStyles';

// The tappable coin pill inside a SwapCard. The whole pill is the touch
// target (minHeight 48), replacing the old invisible 1pt-high dropdown.
const CoinSelectorTrigger = ({option, onPress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const symbol = option?.options?.symbol?.toUpperCase();
  const icon = option?.options?.icon;
  const chainName = option?.options?.chain_display_name;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={symbol ? `Change coin, ${symbol}` : 'Select coin'}>
      {!!icon && (
        <View style={styles.iconBox}>
          <FastImage
            source={{uri: icon}}
            resizeMode={'contain'}
            style={styles.icon}
          />
        </View>
      )}
      <View style={styles.labelBox}>
        <Text style={styles.symbol} numberOfLines={1}>
          {symbol || 'Select coin'}
        </Text>
        {!!chainName && (
          <Text style={styles.chain} numberOfLines={1}>
            {chainName}
          </Text>
        )}
      </View>
      <ArrowDown height={18} width={18} style={{fill: theme.gray}} />
    </TouchableOpacity>
  );
};

export default CoinSelectorTrigger;
