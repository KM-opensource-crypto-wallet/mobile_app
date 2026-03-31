import React, {memo, useCallback, useContext} from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import {Searchbar} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import myStyles from './NotificationCoinStepStyles';
import {coinKey} from 'utils/notificationAlertHelpers';

const NotificationCoinStep = ({
  coins,
  selectedCoinKeys,
  onToggleCoin,
  searchQuery,
  onSearchChange,
  onNext,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const renderItem = useCallback(
    ({item: entry}) => {
      const key = coinKey(entry.walletClientId, entry.coin._id);
      const isSelected = selectedCoinKeys.has(key);
      const isToken = entry.coin.type === 'token';
      const isBitcoin = isBitcoinChain(entry.coin.chain_name);
      return (
        <TouchableOpacity
          style={styles.coinRow}
          onPress={() => onToggleCoin(entry)}>
          <View
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && (
              <MaterialCommunityIcons name="check" size={14} color="white" />
            )}
          </View>
          <CoinIcon item={entry.coin} />
          <View style={styles.coinInfo}>
            <View style={styles.coinSymbolRow}>
              <Text style={styles.coinSymbol}>{entry.coin.symbol}</Text>
            </View>
            <Text style={styles.coinName} numberOfLines={1}>
              {entry.coin.name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedCoinKeys, onToggleCoin, styles],
  );

  return (
    <View style={styles.stepContainer}>
      <Searchbar
        placeholder="Search coins"
        value={searchQuery}
        style={styles.searchInput}
        onChangeText={onSearchChange}
        inputStyle={styles.searchInputMinHeight}
      />
      <FlatList
        data={coins}
        renderItem={renderItem}
        keyExtractor={entry => coinKey(entry.walletClientId, entry.coin._id)}
        bounces={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No coins found</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[
          styles.button,
          selectedCoinKeys.size === 0 && styles.buttonDisabled,
        ]}
        disabled={selectedCoinKeys.size === 0}
        onPress={onNext}>
        <Text style={styles.buttonTitle}>
          Next ({selectedCoinKeys.size} selected)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(NotificationCoinStep);
