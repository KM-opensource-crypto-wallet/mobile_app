import React, {memo, useMemo} from 'react';
import {View, Text} from 'react-native';
import myStyles from './CoinSyncEmptyStateStyles';

const EMPTY_STATE_CONFIG = {
  fetching: {
    title: 'Loading coins...',
    subtitle: 'Fetching available coins to scan',
  },
  creating_wallets: {
    title: 'Preparing wallets...',
    subtitle: 'Creating wallets for different chains',
  },
  syncing: {
    title: 'Scanning for balances...',
    subtitle: 'Checking all coins for balances',
  },
  idle: {
    title: 'Scan for coins',
    subtitle: "We'll check all supported coins for balances",
  },
  completed: {
    title: 'All caught up!',
    subtitle: 'No additional coins with balance found',
  },
};

const CoinSyncEmptyState = ({theme, status, hasCoinsWithBalance}) => {
  const styles = myStyles(theme);

  const config = useMemo(() => {
    if (status === 'fetching') {
      return EMPTY_STATE_CONFIG.fetching;
    }
    if (status === 'creating_wallets') {
      return EMPTY_STATE_CONFIG.creating_wallets;
    }
    if (status === 'syncing') {
      return EMPTY_STATE_CONFIG.syncing;
    }
    if (status === 'idle') {
      return EMPTY_STATE_CONFIG.idle;
    }
    if (status === 'completed' && !hasCoinsWithBalance) {
      return EMPTY_STATE_CONFIG.completed;
    }
    return null;
  }, [status, hasCoinsWithBalance]);

  if (!config) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>
    </View>
  );
};

export default memo(CoinSyncEmptyState);
