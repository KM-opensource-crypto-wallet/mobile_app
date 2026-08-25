import React, {useContext} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import {getDeriveAddressLabel} from 'dok-wallet-blockchain-networks/service/bitcoinHdAddress';

// Per-type colors readable on both light and dark backgrounds (same approach
// as EXCHANGE_STATUS_CONFIG in components/ExchangeHistory/exchangeFormat.js).
export const ADDRESS_TYPE_CONFIG = {
  Receive: {color: '#16A34A'},
  Change: {color: '#D97706'},
  Legacy: {color: '#6B7280'},
  Custom: {color: '#2563EB'},
};

// Receive / Change / Legacy / Custom dot + tinted pill for a derive-address
// entry. Only bitcoin chains have address types, so anything else renders
// nothing.
const AddressTypeBadge = ({chain_name, item}) => {
  const {theme} = useContext(ThemeContext);
  if (!item || !isBitcoinChain(chain_name)) {
    return null;
  }
  const label = getDeriveAddressLabel(chain_name, item);
  const color = ADDRESS_TYPE_CONFIG[label]?.color || theme.gray;
  return (
    <View style={[styles.badge, {backgroundColor: color + '22'}]}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <Text style={[styles.label, {color}]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
    flexShrink: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Roboto-Medium',
  },
});

export default AddressTypeBadge;
