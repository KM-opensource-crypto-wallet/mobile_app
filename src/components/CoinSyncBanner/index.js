import React, {useCallback, useContext} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {
  selectIsSyncing,
  selectCoinSyncProgress,
  selectIsCreatingWallets,
  selectIsFetching,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSelectors';
import {myStyles} from './CoinSyncBannerStyles';

const CoinSyncBanner = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const navigation = useNavigation();

  const isSyncing = useSelector(selectIsSyncing);
  const progress = useSelector(selectCoinSyncProgress);
  const isCreatingWallets = useSelector(selectIsCreatingWallets);
  const isFetching = useSelector(selectIsFetching);

  const progressPercent =
    progress.totalCoins > 0
      ? (progress.completedCoins / progress.totalCoins) * 100
      : 0;

  // Get subtitle text based on current state
  const getSubtitleText = () => {
    if (isFetching) {
      return 'Loading coins...';
    }
    if (isCreatingWallets) {
      return 'Creating wallets...';
    }
    if (isSyncing) {
      return `${progress.completedCoins} of ${progress.totalCoins} coins scanned`;
    }
    return 'Discover coins with existing balances';
  };

  const onPressScan = useCallback(() => {
    navigation.navigate('CoinSyncScreen');
  }, [navigation]);

  return (
    <View style={styles.bannerView}>
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          {isFetching || isCreatingWallets ? (
            <ActivityIndicator size="small" color={theme.background} />
          ) : isSyncing ? (
            <AnimatedCircularProgress
              size={40}
              width={3}
              fill={progressPercent}
              tintColor={theme.background}
              backgroundColor={theme.background + '30'}
              rotation={0}
              lineCap="round">
              {() => (
                <Text style={[styles.percentText, {color: theme.background}]}>
                  {Math.round(progressPercent)}%
                </Text>
              )}
            </AnimatedCircularProgress>
          ) : (
            <MaterialCommunityIcons
              name="wallet-plus"
              size={24}
              color={theme.background}
            />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {isSyncing ? 'Syncing Coins...' : 'Sync Coin Balances'}
          </Text>
          <Text style={styles.bannerSubtitle} numberOfLines={1}>
            {getSubtitleText()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.scanButton, isSyncing && styles.scanButtonActive]}
        onPress={onPressScan}>
        <MaterialCommunityIcons
          name={isSyncing ? 'eye-outline' : 'magnify'}
          size={18}
          color="white"
        />
        <Text style={styles.scanButtonTitle}>
          {isSyncing ? 'View' : 'Scan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CoinSyncBanner;
