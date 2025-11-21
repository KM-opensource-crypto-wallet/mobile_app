import React, {useCallback, useContext} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import Clipboard from '@react-native-clipboard/clipboard';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import Toast from 'react-native-toast-message';
import CopyIcon from 'assets/images/icons/copy.svg';
import ChainItem from 'components/ChainItem';
import {currencySymbol} from 'data/currency';
import CoinIcon from 'components/CoinIcon/CoinIcon';

const BatchTransactionItem = ({
  item,
  isSelected,
  isSelectionMode,
  localCurrency,
  onToggleSelection,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const onCopyAddress = useCallback(address => {
    Clipboard.setString(address);
    triggerHapticFeedbackLight();
    Toast.show({
      type: 'successToast',
      text1: 'Copied Address',
    });
  }, []);

  return (
    <TouchableOpacity
      style={[
        styles.transactionItem,
        isSelected && styles.selectedTransactionItem,
      ]}
      onPress={() => isSelectionMode && onToggleSelection?.(item.transactionId)}
      disabled={!isSelectionMode}>
      <>
        <View style={styles.topItem}>
          {isSelectionMode && (
            <View style={styles.selectionIndicator}>
              <MaterialCommunityIcons
                name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={isSelected ? theme.background : theme.gray}
              />
            </View>
          )}
          <CoinIcon item={item.coinInfo} />
          <View style={styles.transactionContent}>
            <View style={styles.transactionHeader}>
              <View style={styles.titleContainer}>
                <View style={styles.coinNameRow}>
                  <Text style={styles.transactionTitle}>
                    {item.coinInfo.symbol}
                  </Text>
                  <ChainItem
                    chain_display_name={item?.coinInfo?.chain_display_name}
                  />
                </View>
                <Text style={styles.coinFullName}>{item.coinInfo.name}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.transactionAmount}>
                  {item.transferData.amount}
                </Text>
                <Text style={styles.currencySymbol}>
                  {currencySymbol[localCurrency] || ''}
                  {item?.transferData?.fiatAmount}
                </Text>
                {item.is_exceed_balance && (
                  <View style={styles.exceedBalanceContainer}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={12}
                      color="#ff4444"
                    />
                    <Text style={styles.exceedBalanceText}>
                      Balance exceeded
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={styles.addressSection}>
          <View style={styles.addressRow}>
            <View style={styles.addressContainer}>
              <View style={styles.subAddressContainer}>
                <Text style={styles.addressLabel}>From</Text>
                <Text style={styles.addressText}>
                  {item.transferData.fromAddress.slice(0, 8)}...
                  {item.transferData.fromAddress.slice(-6)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onCopyAddress(item?.transferData?.fromAddress || '');
                }}>
                <CopyIcon fill={theme.background} width={20} height={30} />
              </TouchableOpacity>
            </View>
            <View style={styles.arrowContainer}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color={theme.gray}
              />
            </View>
            <View style={styles.addressContainer}>
              <View style={styles.subAddressContainer}>
                <Text style={styles.addressLabel}>To</Text>
                <Text style={styles.addressText}>
                  {item?.transferData?.toAddress?.slice?.(0, 8)}...
                  {item?.transferData?.toAddress?.slice?.(-6)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onCopyAddress(item?.transferData?.toAddress || '');
                }}>
                <CopyIcon fill={theme.background} width={20} height={30} />
              </TouchableOpacity>
            </View>
          </View>
          {item.is_exceed_balance && (
            <View style={styles.requireAmountSection}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color="#ff9500"
              />
              <Text style={styles.requireAmountText}>
                Required amount: {item.require_amount} {item.coinInfo.symbol}
              </Text>
            </View>
          )}
        </View>
      </>
    </TouchableOpacity>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    transactionItem: {
      backgroundColor: theme.secondaryBackgroundColor,
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
    },
    selectedTransactionItem: {
      backgroundColor: theme.lightBackground,
      borderColor: theme.background,
      borderWidth: 2,
    },
    topItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectionIndicator: {
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    coinIconContainer: {
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
      backgroundColor: theme.font,
      borderRadius: 20,
    },
    coinIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    transactionContent: {
      flex: 1,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    titleContainer: {
      flex: 1,
    },
    coinNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.font,
      flexShrink: 1,
    },
    coinFullName: {
      fontSize: 12,
      color: theme.gray,
    },
    amountContainer: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.font,
    },
    currencySymbol: {
      fontSize: 12,
      color: theme.gray,
      marginTop: 2,
    },
    exceedBalanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    exceedBalanceText: {
      fontSize: 10,
      color: '#ff4444',
      marginLeft: 4,
      fontWeight: '500',
    },
    addressSection: {
      marginVertical: 8,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    arrowContainer: {
      paddingHorizontal: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addressContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    subAddressContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    addressLabel: {
      fontSize: 10,
      color: theme.gray,
      marginBottom: 2,
    },
    addressText: {
      fontSize: 11,
      color: theme.font,
      fontFamily: 'monospace',
    },
    requireAmountSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: '#ff950020',
      borderRadius: 6,
      borderLeftWidth: 3,
      borderLeftColor: '#ff9500',
    },
    requireAmountText: {
      fontSize: 12,
      color: '#ff9500',
      marginLeft: 6,
      fontWeight: '500',
      flex: 1,
    },
  });

export default BatchTransactionItem;
