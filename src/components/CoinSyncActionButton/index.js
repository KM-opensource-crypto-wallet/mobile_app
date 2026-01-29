import React, {memo, useMemo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import myStyles from './CoinSyncActionButtonStyles';

const BUTTON_CONFIG = {
  idle: {
    icon: 'magnify',
    text: 'Start Scan',
    isCancel: false,
  },
  syncing: {
    icon: 'close',
    text: 'Cancel',
    isCancel: true,
  },
  error: {
    icon: 'refresh',
    text: 'Retry',
    isCancel: false,
  },
};

const CoinSyncActionButton = ({
  theme,
  status,
  onStartSync,
  onCancel,
  onAddCoins,
  selectedCount,
  totalCoinsWithBalance,
  disabled,
}) => {
  const styles = myStyles(theme);

  const buttonConfig = useMemo(() => {
    if (status === 'idle') {
      return {...BUTTON_CONFIG.idle, onPress: onStartSync};
    }
    if (
      status === 'syncing' ||
      status === 'creating_wallets' ||
      status === 'fetching'
    ) {
      return {...BUTTON_CONFIG.syncing, onPress: onCancel, disabled};
    }
    if (status === 'completed') {
      const hasCoinsToAdd = totalCoinsWithBalance > 0;
      const buttonText = hasCoinsToAdd
        ? `Add ${selectedCount} Coin${selectedCount !== 1 ? 's' : ''}`
        : 'Done';
      return {
        icon: hasCoinsToAdd ? 'plus' : 'check',
        text: buttonText,
        isCancel: false,
        onPress: onAddCoins,
        disabled: hasCoinsToAdd && selectedCount === 0,
      };
    }
    if (status === 'error') {
      return {...BUTTON_CONFIG.error, onPress: onStartSync};
    }
    return null;
  }, [
    status,
    onStartSync,
    onCancel,
    onAddCoins,
    selectedCount,
    totalCoinsWithBalance,
    disabled,
  ]);

  if (!buttonConfig) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, buttonConfig.isCancel && styles.buttonCancel]}
        onPress={buttonConfig.onPress}
        disabled={buttonConfig.disabled}>
        <MaterialCommunityIcons
          name={buttonConfig.icon}
          size={22}
          color="white"
        />
        <Text style={styles.buttonText}>{buttonConfig.text}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(CoinSyncActionButton);
