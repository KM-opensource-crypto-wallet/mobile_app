import React, {memo, useCallback, useContext} from 'react';
import {View, Text, TouchableOpacity, SectionList} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import DokDropdown from 'components/DokDropdown';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import myStyles from './NotificationAddressStepStyles';
import {coinKey, buildAddressOptions} from 'utils/notificationAlertHelpers';

const NotificationAddressStep = ({
  selectedCoinEntries,
  addressMap,
  onAddressChange,
  onNext,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const renderSectionHeader = useCallback(
    ({section: {entry}}) => {
      const isToken = entry.coin.type === 'token';
      const isBitcoin = isBitcoinChain(entry.coin.chain_name);
      return (
        <View style={styles.sectionHeader}>
          <CoinIcon item={entry.coin} />
          <View style={styles.coinInfo}>
            <View style={styles.coinSymbolRow}>
              <Text style={styles.coinSymbol}>{entry.coin.symbol}</Text>
              {(isToken || isBitcoin) && (
                <ChainItem chain_display_name={entry.coin.chain_display_name} />
              )}
            </View>
            <Text style={styles.coinName}>{entry.walletName}</Text>
          </View>
        </View>
      );
    },
    [styles],
  );

  const renderItem = useCallback(
    ({item: entry}) => {
      const key = coinKey(entry.walletClientId, entry.coin._id);
      const options = buildAddressOptions(entry.coin);
      const selectedAddr = addressMap[key] || options[0]?.value || '';
      return (
        <View style={styles.addressDropdownContainer}>
          <DokDropdown
            title="Wallet Address"
            data={options}
            value={selectedAddr}
            onChangeValue={item => onAddressChange(key, item.value)}
          />
        </View>
      );
    },
    [addressMap, onAddressChange, styles],
  );

  return (
    <View style={styles.stepContainer}>
      <SectionList
        sections={selectedCoinEntries.map(entry => ({
          entry,
          data: [entry],
        }))}
        keyExtractor={(_, index) => String(index)}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        bounces={false}
        stickySectionHeadersEnabled={false}
      />
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonTitle}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(NotificationAddressStep);
