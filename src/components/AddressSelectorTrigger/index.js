import React, {useContext} from 'react';
import {Keyboard, Text, TouchableOpacity, View} from 'react-native';
import ArrowDown from 'assets/images/buy/arrow-down.svg';
import AddressTypeBadge from 'components/AddressTypeBadge';
import {ThemeContext} from 'theme/ThemeContext';
import {
  getCustomizePublicAddress,
  isBitcoinChain,
} from 'dok-wallet-blockchain-networks/helper';
import {formatDeriveAddressBalance} from 'dok-wallet-blockchain-networks/helper/deriveAddressBalance';
import myStyles from './AddressSelectorTriggerStyles';

// Closed state of the address picker: a dropdown-sized field showing the
// selected address with its type badge (and balance for bitcoin chains).
// Tapping it should present an AddressSelectorSheet.
const AddressSelectorTrigger = ({
  title,
  titleStyle,
  chain_name,
  item,
  symbol,
  decimal,
  fallbackAddress,
  onPress,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const address = item?.address || fallbackAddress;
  const showBalance = isBitcoinChain(chain_name) && !!item;
  return (
    <View>
      {!!title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      <TouchableOpacity
        style={styles.field}
        onPress={() => {
          Keyboard.dismiss();
          onPress?.();
        }}>
        {/* Address + type on line 1, balance on line 2: the shortened
            address is never clipped by its neighbours. */}
        <View style={styles.leftColumn}>
          <View style={styles.leftRow}>
            <Text style={styles.addressText}>
              {getCustomizePublicAddress(address) || 'Select address'}
            </Text>
            <AddressTypeBadge chain_name={chain_name} item={item} />
          </View>
          {showBalance && (
            <Text style={styles.balanceText} numberOfLines={1}>
              {formatDeriveAddressBalance({
                balance: item?.balance,
                decimal,
                symbol,
              })}
            </Text>
          )}
        </View>
        <ArrowDown height="30" width="30" style={{fill: theme.gray}} />
      </TouchableOpacity>
    </View>
  );
};

export default AddressSelectorTrigger;
