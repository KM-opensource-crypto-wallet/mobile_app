import React, {memo, useCallback, useContext, useRef} from 'react';
import {View, Text, TouchableOpacity, SectionList} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import AddressSelectorSheet from 'components/AddressSelectorSheet';
import AddressSelectorTrigger from 'components/AddressSelectorTrigger';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import {getVisibleDeriveAddresses} from 'dok-wallet-blockchain-networks/service/bitcoinHdAddress';
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
  // One sheet serves every row (a sheet per SectionList row would mount a
  // modal per coin); the pressed row's key comes back via the context param.
  const addressSheetRef = useRef();

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

  const onSelectAddress = useCallback(
    (item, context) => {
      if (context?.key && item?.address) {
        onAddressChange(context.key, item.address);
      }
    },
    [onAddressChange],
  );

  const renderItem = useCallback(
    ({item: entry}) => {
      const key = coinKey(entry.walletClientId, entry.coin._id);
      const options = buildAddressOptions(entry.coin);
      const selectedAddr = addressMap[key] || options[0]?.value || '';
      const items = getVisibleDeriveAddresses(
        entry.coin.chain_name,
        entry.coin.deriveAddresses,
      );
      if (items.length <= 1) {
        return null;
      }
      const selectedItem = items.find(
        subItem => subItem?.address === selectedAddr,
      );
      return (
        <View style={styles.addressDropdownContainer}>
          <AddressSelectorTrigger
            title={'Wallet Address'}
            chain_name={entry.coin.chain_name}
            item={selectedItem}
            symbol={entry.coin.symbol}
            fallbackAddress={selectedAddr}
            onPress={() =>
              addressSheetRef.current?.present({
                chain_name: entry.coin.chain_name,
                symbol: entry.coin.symbol,
                items,
                selectedAddress: selectedAddr,
                context: {key},
              })
            }
          />
        </View>
      );
    },
    [addressMap, styles],
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
      <AddressSelectorSheet ref={addressSheetRef} onSelect={onSelectAddress} />
    </View>
  );
};

export default memo(NotificationAddressStep);
