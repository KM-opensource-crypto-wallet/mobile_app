import React, {memo, useCallback, useContext} from 'react';
import {Text, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './NotificationAlertItemStyles';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';

const truncateAddress = address => {
  if (!address || address.length <= 14) {
    return address || '';
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const NotificationAlertItem = ({item, onPressDelete, onPressEdit}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const onEdit = useCallback(() => {
    onPressEdit?.(item);
  }, [item, onPressEdit]);

  const onDelete = useCallback(() => {
    onPressDelete?.(item);
  }, [item, onPressDelete]);

  const coinIconItem = {
    icon: item.coinIcon,
    chain_name: item.chainName,
    type: item.coinType,
  };

  const isToken = item.coinType === 'token';
  const isBitcoin = isBitcoinChain(item.chainName);
  const showChainBadge = isToken || isBitcoin;

  return (
    <View style={styles.itemRow}>
      <CoinIcon item={coinIconItem} />
      <View style={styles.leftContainer}>
        <View style={styles.rowView}>
          <Text style={styles.coinSymbol} numberOfLines={1}>
            {item.coinSymbol}
          </Text>
          {showChainBadge && (
            <ChainItem chain_display_name={item.chainDisplayName} />
          )}
        </View>
        <Text style={styles.walletName} numberOfLines={1}>
          {item.walletName}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {truncateAddress(item.wallet)}
        </Text>
        <Text style={styles.minAmount}>
          {`Min: ${item.minAmount} ${item.coinSymbol}`}
        </Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              item.notifyOnReceive ? styles.badgeActive : styles.badgeInactive,
            ]}>
            <Text style={styles.badgeText}>Receive</Text>
          </View>
          <View
            style={[
              styles.badge,
              item.notifyOnSend ? styles.badgeActive : styles.badgeInactive,
            ]}>
            <Text style={styles.badgeText}>Send</Text>
          </View>
        </View>
      </View>
      <Menu optionsContainerStyle={styles.optionsContainer}>
        <MenuTrigger>
          <View style={styles.menuTrigger}>
            <EntypoIcon
              size={24}
              name={'dots-three-vertical'}
              color={theme.font}
            />
          </View>
        </MenuTrigger>
        <MenuOptions optionsContainerStyle={styles.optionsContainer}>
          <MenuOption onSelect={onEdit}>
            <View style={styles.optionMenu}>
              <EntypoIcon
                size={20}
                name={'edit'}
                color={theme.borderActiveColor}
              />
              <Text style={styles.optionText}>{'Edit'}</Text>
            </View>
          </MenuOption>
          <MenuOption onSelect={onDelete}>
            <View style={styles.optionMenu2}>
              <Ionicons
                name={'trash'}
                resizeMode={'contain'}
                size={20}
                style={styles.trashIcon}
                color={'red'}
              />
              <Text style={[styles.optionText, styles.deleteOptionText]}>
                {'Delete'}
              </Text>
            </View>
          </MenuOption>
        </MenuOptions>
      </Menu>
    </View>
  );
};

export default memo(NotificationAlertItem);
