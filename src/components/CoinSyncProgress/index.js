import React, {memo, useMemo} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import myStyles from './CoinSyncProgressStyles';

const CoinSyncProgress = ({
  theme,
  progress,
  currentCoin,
  isSyncing,
  status,
}) => {
  const styles = myStyles(theme);
  const isCreatingWallets = status === 'creating_wallets';
  const isCompleted = status === 'completed';
  const isError = status === 'error';
  const isFetching = status === 'fetching';

  const progressPercent = useMemo(() => {
    if (isCompleted) {
      return 100;
    }
    return progress.totalCoins > 0
      ? (progress.completedCoins / progress.totalCoins) * 100
      : 0;
  }, [isCompleted, progress.completedCoins, progress.totalCoins]);

  const statusText = useMemo(() => {
    if (isFetching) {
      return 'Loading coins...';
    }
    if (isCreatingWallets) {
      return 'Creating wallets...';
    }
    if (isSyncing) {
      return `Scanning ${progress.completedCoins} of ${progress.totalCoins}`;
    }
    if (isCompleted) {
      return 'Sync Complete!';
    }
    if (isError) {
      return 'Error occurred';
    }
    return 'Ready to scan';
  }, [
    isFetching,
    isCreatingWallets,
    isSyncing,
    isCompleted,
    isError,
    progress.completedCoins,
    progress.totalCoins,
  ]);

  const renderProgressContent = () => {
    if (isError) {
      return (
        <MaterialCommunityIcons name="alert-circle" size={40} color="#f44336" />
      );
    }
    if (isCompleted) {
      return (
        <MaterialCommunityIcons
          name="check-circle"
          size={40}
          color={theme.background}
        />
      );
    }
    if (isFetching || isCreatingWallets) {
      return <ActivityIndicator size="large" color={theme.background} />;
    }
    if (isSyncing) {
      return (
        <Text style={[styles.percentage, {color: theme.background}]}>
          {Math.round(progressPercent)}%
        </Text>
      );
    }
    return (
      <MaterialCommunityIcons
        name="magnify"
        size={40}
        color={theme.background}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        <AnimatedCircularProgress
          size={120}
          width={8}
          fill={progressPercent}
          tintColor={isError ? '#f44336' : theme.background}
          backgroundColor={theme.walletItemColor}
          rotation={0}
          lineCap="round">
          {() => (
            <View style={styles.progressInner}>{renderProgressContent()}</View>
          )}
        </AnimatedCircularProgress>
      </View>
      <Text style={styles.mainText}>{statusText}</Text>
      {isSyncing && currentCoin && (
        <Text style={styles.currentCoinText} numberOfLines={1}>
          {currentCoin.name} ({currentCoin.symbol})
        </Text>
      )}
    </View>
  );
};

export default memo(CoinSyncProgress);
