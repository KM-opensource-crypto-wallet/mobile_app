import React, {memo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import {myStyles} from './CoinSyncItemStyles';

const CoinSyncItem = ({coin, theme, isSelectable, isSelected, onToggle}) => {
  const styles = myStyles(theme);
  const {totalBalance} = coin;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
      disabled={!isSelectable}>
      {isSelectable && (
        <View style={styles.checkboxContainer}>
          <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={isSelected ? theme.background : theme.gray}
          />
        </View>
      )}
      <CoinIcon item={coin} />
      <View style={styles.infoContainer}>
        <Text style={styles.coinName} numberOfLines={1}>
          {coin.name}
        </Text>
        <Text style={styles.coinDetails} numberOfLines={1}>
          {coin.symbol} • {coin.chain_display_name || coin.chain_name}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, styles.syncedText]}>
          {totalBalance || '0'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(CoinSyncItem);
