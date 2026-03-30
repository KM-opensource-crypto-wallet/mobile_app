import React, {useCallback, useContext} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {
  selectIsSyncing,
  selectCoinSyncProgress,
  selectIsCreatingWallets,
  selectIsFetching,
  selectIsBannerDismissed,
  selectSyncingWalletName,
  selectCoinSyncStatus,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSelectors';
import {dismissBanner} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSlice';
import {myStyles} from './CoinSyncBannerStyles';
import {isCoinsScanTimestampValid} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';

const CoinSyncBanner = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const isSyncing = useSelector(selectIsSyncing);
  const progress = useSelector(selectCoinSyncProgress);
  const isCreatingWallets = useSelector(selectIsCreatingWallets);
  const isFetching = useSelector(selectIsFetching);
  const isBannerDismissed = useSelector(selectIsBannerDismissed);
  const syncingWalletName = useSelector(selectSyncingWalletName);
  const status = useSelector(selectCoinSyncStatus);
  const isCompleted = status === 'completed';
  const isFailed = status === 'error';

  const isValidTimestamp = useSelector(isCoinsScanTimestampValid);

  const progressPercent =
    progress.totalCoins > 0
      ? (progress.completedCoins / progress.totalCoins) * 100
      : 0;

  const getSubtitleText = () => {
    if (isFetching) {
      return 'Preparing asset scan...';
    }
    if (isCreatingWallets) {
      return 'Adding discovered assets...';
    }
    if (isSyncing) {
      const walletPrefix = syncingWalletName ? `${syncingWalletName} - ` : '';
      return `${walletPrefix}${progress.completedCoins} of ${progress.totalCoins} assets checked`;
    }

    if (isCompleted) {
      const walletPrefix = syncingWalletName ? `${syncingWalletName} - ` : '';
      return `${walletPrefix}${progress.completedCoins} are completed`;
    }
    if (isFailed) {
      const walletPrefix = syncingWalletName ? `${syncingWalletName} - ` : '';
      return `${walletPrefix} coins scan is failed`;
    }
    return 'Scan 200+ coins to find your assets';
  };

  const onPressScan = useCallback(() => {
    navigation.navigate('CoinSyncScreen');
  }, [navigation]);

  const onPressClose = useCallback(() => {
    dispatch(dismissBanner());
  }, [dispatch]);

  if (
    (!isValidTimestamp || isBannerDismissed) &&
    !isSyncing &&
    !isCompleted &&
    !isFailed
  ) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.bannerView}
      activeOpacity={0.7}
      onPress={onPressScan}>
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
              name={
                isCompleted
                  ? 'check-circle'
                  : isFailed
                  ? 'error'
                  : 'wallet-plus'
              }
              size={24}
              color={theme.background}
            />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {isSyncing
              ? 'Scanning Assets...'
              : isCompleted
              ? 'Scan Completed'
              : isFailed
              ? 'Scan Failed'
              : 'Find My Assets'}
          </Text>
          <Text style={styles.bannerSubtitle} numberOfLines={1}>
            {getSubtitleText()}
          </Text>
        </View>
      </View>
      {!isSyncing ? (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onPressClose}
          hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
          <MaterialCommunityIcons
            name="close-circle"
            size={22}
            color={theme.gray}
          />
        </TouchableOpacity>
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.gray}
        />
      )}
    </TouchableOpacity>
  );
};

export default CoinSyncBanner;
