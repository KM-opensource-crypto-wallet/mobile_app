import React, {memo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import {currencySymbol} from 'data/currency';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {myStyles} from './CoinSyncItemStyles';

const CoinSyncItem = ({coin, theme, isSelectable, isSelected, onToggle}) => {
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const {totalBalance, totalBalanceCourse, symbol} = coin;
  const isToken = coin?.type === 'token';
  const isBitcoin = isBitcoinChain(coin?.chain_name);

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
      <View style={styles.list}>
        <View style={styles.box}>
          <View style={styles.item}>
            <View style={styles.rowStyle}>
              <Text style={styles.title} numberOfLines={1}>
                {symbol}
              </Text>
              {(isToken || isBitcoin) && (
                <ChainItem chain_display_name={coin?.chain_display_name} />
              )}
            </View>
            <Text style={styles.text} numberOfLines={1}>
              {coin?.name}
            </Text>
          </View>
          <View style={styles.itemNumber}>
            <Text style={styles.title}>
              {totalBalance || '0'} {symbol}
            </Text>
            <Text style={styles.text}>
              {currencySymbol[localCurrency] || ''}
              {totalBalanceCourse}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(CoinSyncItem);
