import {FlatList, Text, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './CustomRPCStyles';
import {useCallback, useContext, useMemo} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import EmptyView from '../EmptyView';
import {useDispatch, useSelector} from 'react-redux';
import {selectAllCustomRpc} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSelectors';
import {deleteCustomRpc} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSlice';
import {selectVisibleWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from '@d11/react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import {chainLogoMap} from 'assets/chain_logo';

const CustomRPC = () => {
  const navigation = useNavigation();
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const dispatch = useDispatch();
  const allWallets = useSelector(selectVisibleWallets);
  const allCustomRpcList = useSelector(selectAllCustomRpc);

  // Group entries by chain_name + customRpcUrl so wallets sharing same RPC appear in one card
  const groupedList = useMemo(() => {
    const items = Object.values(allCustomRpcList);
    const map = {};
    items.forEach(item => {
      const key = `${item.chain_name}__${item.customRpcUrl}`;
      if (!map[key]) {
        map[key] = {
          key,
          chain_name: item.chain_name,
          chain_display_name: item.chain_display_name,
          customRpcUrl: item.customRpcUrl,
          walletClientIds: [],
        };
      }
      map[key].walletClientIds.push(item.walletClientId);
    });
    return Object.values(map);
  }, [allCustomRpcList]);

  const keyExtractor = useCallback(item => item.key, []);

  const onEdit = useCallback(
    item => {
      navigation.navigate('AddCustomRPC', {
        chain_name: item.chain_name,
        chain_display_name: item.chain_display_name,
        customRpcUrl: item.customRpcUrl,
        wallets: item.walletClientIds,
      });
    },
    [navigation],
  );

  const onDelete = useCallback(
    item => {
      item.walletClientIds.forEach(walletClientId => {
        dispatch(
          deleteCustomRpc({
            chain_name: item.chain_name,
            walletClientId,
          }),
        );
      });
    },
    [dispatch],
  );

  const renderItem = useCallback(
    ({item}) => {
      const chainLogo = chainLogoMap[item.chain_name?.toLowerCase()];
      const walletNames = item.walletClientIds
        .map(id => allWallets?.find(w => w.clientId === id)?.walletName)
        .filter(Boolean);

      return (
        <View style={styles.card}>
          {/* Card header: chain icon + chain name + three-dot menu */}
          <View style={styles.cardHeader}>
            <View style={styles.chainRow}>
              {chainLogo ? (
                <FastImage
                  source={chainLogo}
                  resizeMode="contain"
                  style={styles.chainIcon}
                />
              ) : (
                <View style={styles.chainIconPlaceholder}>
                  <Ionicons name="globe-outline" size={20} color={theme.font} />
                </View>
              )}
              <Text style={styles.chainName} numberOfLines={1}>
                {item.chain_display_name}
              </Text>
            </View>
            <Menu>
              <MenuTrigger>
                <View style={styles.menuTrigger}>
                  <EntypoIcon
                    size={20}
                    name={'dots-three-vertical'}
                    color={theme.font}
                  />
                </View>
              </MenuTrigger>
              <MenuOptions
                customStyles={{optionsContainer: styles.optionsContainer}}>
                <MenuOption onSelect={() => onEdit(item)}>
                  <View style={styles.optionMenu}>
                    <EntypoIcon
                      size={18}
                      name={'edit'}
                      color={theme.borderActiveColor}
                    />
                    <Text style={styles.optionText}>{'Edit'}</Text>
                  </View>
                </MenuOption>
                <MenuOption onSelect={() => onDelete(item)}>
                  <View style={styles.optionMenu}>
                    <Ionicons name={'trash'} size={18} color={'red'} />
                    <Text style={[styles.optionText, styles.deleteText]}>
                      {'Delete'}
                    </Text>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* RPC URL as heading */}
          <Text style={styles.rpcUrl} numberOfLines={2}>
            {item.customRpcUrl}
          </Text>

          {/* Wallet names */}
          {walletNames.length > 0 && (
            <View style={styles.walletRow}>
              <Ionicons
                name="wallet-outline"
                size={14}
                color={theme.font}
                style={styles.walletIcon}
              />
              <Text style={styles.walletNames} numberOfLines={2}>
                {walletNames.join(' · ')}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [allWallets, onDelete, onEdit, styles, theme],
  );

  return (
    <View style={styles.container}>
      <FlatList
        bounces={false}
        keyboardShouldPersistTaps={'always'}
        style={styles.flatlistStyle}
        contentContainerStyle={styles.contentContainerStyle}
        keyExtractor={keyExtractor}
        data={groupedList}
        renderItem={renderItem}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListEmptyComponent={
          <EmptyView
            text="No Custom RPC URL is available"
            buttonText="Add Custom RPC"
            onPressButton={() => navigation.navigate('AddCustomRPC')}
          />
        }
      />
    </View>
  );
};

export default CustomRPC;
