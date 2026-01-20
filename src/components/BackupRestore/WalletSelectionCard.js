import React, {useContext} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {ThemeContext} from 'theme/ThemeContext';
import Checkbox from 'components/Checkbox';

// Helper functions (copied/adapted from Wallets/index.js to ensure self-contained logic)
const getWalletTotalBalance = coins => {
  let total = 0;
  coins?.forEach(coin => {
    if (coin?.isInWallet) {
      const value = isNaN(Number(coin.totalBalanceCourse))
        ? 0
        : Number(coin.totalBalanceCourse);
      total += value;
    }
  });
  return total;
};

const getTopTwoCoins = coins => {
  if (!coins || !Array.isArray(coins)) {
    return [];
  }
  const walletCoins = coins.filter(coin => coin?.isInWallet);
  const sorted = [...walletCoins].sort((a, b) => {
    const aValue = isNaN(Number(a.totalCourse)) ? 0 : Number(a.totalCourse);
    const bValue = isNaN(Number(b.totalCourse)) ? 0 : Number(b.totalCourse);
    return bValue - aValue;
  });
  return sorted.slice(0, 2);
};

const getCoinsCount = coins => {
  if (!coins || !Array.isArray(coins)) {
    return 0;
  }
  return coins.filter(coin => coin?.isInWallet).length;
};

const formatBalance = value => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (value >= 1000) {
    return value.toLocaleString('en-US', {maximumFractionDigits: 2});
  }
  return value.toFixed(2);
};

const WalletSelectionCard = ({
  item,
  isSelected,
  toggleSelect,
  currencySymbol = '$',
  isRestored = false,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const hasCoinsData = item.coins && Array.isArray(item.coins);

  // Computed Values
  const walletTypeLabel = item?.isImportWalletWithPrivateKey
    ? `${item?.coins?.[0]?.chain_display_name || ''} Wallet`
    : 'Multi-Coin Wallet';

  // Balance Logic
  const totalBalance = hasCoinsData ? getWalletTotalBalance(item.coins) : 0;
  const topCoins = hasCoinsData ? getTopTwoCoins(item.coins) : [];
  const coinsCount = hasCoinsData ? getCoinsCount(item.coins) : 0;

  return (
    <TouchableOpacity
      style={[
        styles.walletCard,
        isSelected && styles.walletCardSelected,
        isRestored && styles.walletCardDisabled,
      ]}
      onPress={() => !isRestored && toggleSelect(item.clientId)}
      activeOpacity={isRestored ? 1 : 0.7}
      disabled={isRestored}>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          {isRestored ? (
            <View style={styles.restoredPill}>
              <Text style={styles.restoredText}>Restored</Text>
            </View>
          ) : (
            <Checkbox
              checked={isSelected}
              onChange={() => toggleSelect(item.clientId)}
            />
          )}
          <View style={styles.titleWrapper}>
            <Text
              style={[
                styles.walletName,
                isSelected && styles.walletNameSelected,
                isRestored && styles.walletNameDisabled,
              ]}
              numberOfLines={1}>
              {item.walletName}
            </Text>
            <Text style={styles.walletType}>{walletTypeLabel}</Text>
          </View>
        </View>

        {/* Divider if we have balance info */}
        {hasCoinsData && (
          <View style={styles.balanceSection}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text
                style={[
                  styles.balanceValue,
                  isSelected && styles.balanceValueSelected,
                  isRestored && styles.balanceValueDisabled,
                ]}>
                {currencySymbol}
                {formatBalance(totalBalance)}
              </Text>
            </View>

            <View style={styles.coinsInfo}>
              <View style={styles.topCoinsContainer}>
                {topCoins.map((coin, index) => (
                  <View
                    key={coin?._id || index}
                    style={[
                      styles.coinIconWrapper,
                      index > 0 && styles.coinIconOverlap,
                    ]}>
                    {coin?.icon && (
                      <FastImage
                        source={{uri: coin.icon}}
                        style={styles.coinIcon}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                ))}
              </View>
              <Text style={styles.coinsCountText}>
                {coinsCount} {coinsCount === 1 ? 'coin' : 'coins'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    walletCard: {
      backgroundColor: theme.secondaryBackgroundColor || theme.backgroundColor,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.headerBorder || '#e0e0e0',
      marginBottom: 12,
      padding: 16,
      // Pro Shadow
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    walletCardSelected: {
      borderColor: theme.background || theme.primary,
      borderWidth: 1.5,
      backgroundColor: theme.secondaryBackgroundColor
        ? theme.secondaryBackgroundColor
        : 'rgba(0,123,255,0.02)',
    },
    walletCardDisabled: {
      opacity: 0.6,
      borderColor: 'rgba(0,0,0,0.2)',
      backgroundColor: theme.backgroundColor,
    },
    contentContainer: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center', // Align center vertically
      marginBottom: 4,
    },
    titleWrapper: {
      flex: 1,
      paddingLeft: 12, // Spacing from checkbox
    },
    walletName: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.font,
      marginBottom: 4,
    },
    walletNameSelected: {
      fontWeight: '700',
      color: theme.background || theme.font,
    },
    walletNameDisabled: {
      color: theme.gray,
    },
    walletType: {
      fontSize: 13,
      color: theme.gray,
      fontWeight: '500',
    },
    // Restored Pill
    restoredPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.secondary || '#e0e0e0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    restoredText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.gray,
    },
    // Balance Section
    balanceSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.headerBorder || 'rgba(0,0,0,0.05)',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    balanceInfo: {
      flex: 1,
    },
    balanceLabel: {
      fontSize: 12,
      color: theme.gray,
      marginBottom: 4,
    },
    balanceValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.font,
    },
    balanceValueSelected: {
      color: theme.background || theme.font,
    },
    balanceValueDisabled: {
      color: theme.gray,
    },
    topCoinsContainer: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    coinIconWrapper: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
      borderWidth: 2,
      borderColor: theme.secondaryBackgroundColor || '#fff',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    coinIconOverlap: {
      marginLeft: -8,
    },
    coinIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    coinsCountText: {
      fontSize: 12,
      color: theme.gray,
      fontWeight: '500',
    },
  });

export default WalletSelectionCard;
