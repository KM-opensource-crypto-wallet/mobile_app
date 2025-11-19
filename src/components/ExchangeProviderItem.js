import React, { useContext } from 'react';
import { Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { ThemeContext } from '../theme/ThemeContext';
const ExchangeProviderItem = ({
  item,
  selectedToAsset,
  selectedFromAsset,
  selectedExchangeChain,
  onPressItem,
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <TouchableOpacity
      onPress={() => onPressItem(item)}
      style={[
        styles.itemView,
        selectedExchangeChain?.providerName === item?.providerName && {
          borderColor: theme.background,
          borderWidth: 2,
        },
      ]}>
      <FastImage source={{ uri: item?.src }} style={styles.iconView} />
      <View style={styles.rightView}>
        <Text style={styles.titleStyle} numberOfLines={1}>
          {item?.title}
          <Text style={styles.descriptionStyle}>
            {` (Min: ${item?.minAmount} ${selectedFromAsset?.symbol})`}
          </Text>
        </Text>
        <Text style={styles.highlight} numberOfLines={1}>
          {`${item?.toAmount} ${selectedToAsset?.symbol}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
const myStyles = theme =>
  StyleSheet.create({
    itemView: {
      height: 60,
      width: '100%',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.gray,
      marginTop: 16,
      alignItems: 'center',
      paddingHorizontal: 8,
      flexDirection: 'row',
    },
    iconView: {
      height: 32,
      width: 32,
      marginRight: 12,
      borderRadius: 24,
    },
    rightView: {
      flex: 1,
    },
    titleStyle: {
      textAlign: 'left',
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    descriptionStyle: {
      textAlign: 'left',
      color: theme.primary,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    highlight: {
      textAlign: 'left',
      color: theme.background,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 4,
      flexShrink: 1,
    },
  });
export default ExchangeProviderItem;
