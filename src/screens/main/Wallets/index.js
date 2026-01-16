import React, {
  useLayoutEffect,
  useRef,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from 'react';
import {Keyboard, Text, TouchableOpacity, View} from 'react-native';
import myStyles from './WalletsStyles';
import {useSelector, useDispatch} from 'react-redux';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome6';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FastImage from '@d11/react-native-fast-image';

import {ThemeContext} from 'theme/ThemeContext';
import CreateWalletSheet from 'components/CreateWalletSheet';
import AddIcon from 'assets/images/sidebarIcons/Add.svg';
import FilterListIcon from 'assets/images/icons/filter-list.svg';
import SortMenu from 'components/SortMenu';
import {
  getCurrentWalletIndex,
  selectAllWallets,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  rearrangeWallet,
  setCurrentWalletIndex,
  setWalletPosition,
  sortWallets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {Searchbar} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {
  getLocalCurrency,
  getWalletsSortOption,
} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {setWalletsSortOption} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {currencySymbol} from 'data/currency';

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

const WALLET_SORT_OPTIONS = {
  DEFAULT: 'default',
  VALUE_DESC: 'value_desc',
  VALUE_ASC: 'value_asc',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
};

const Wallets = ({navigation}) => {
  const currentWalletName = useSelector(selectCurrentWallet)?.walletName;
  const allWallets = useSelector(selectAllWallets);
  const currentWalletIndex = useSelector(getCurrentWalletIndex);
  const localCurrency = useSelector(getLocalCurrency);
  const walletSheetRef = useRef();
  const allWalletsLength = useMemo(() => {
    return allWallets.length;
  }, [allWallets]);
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const isFocus = useIsFocused();
  const [searchWallets, setSearchWallets] = useState([]);
  const sortOption = useSelector(getWalletsSortOption);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({top: 0, right: 0});
  const filterButtonRef = useRef(null);

  // Dispatch sort action when sortOption changes
  useEffect(() => {
    if (sortOption !== WALLET_SORT_OPTIONS.DEFAULT) {
      dispatch(sortWallets({sortOption}));
    }
  }, [sortOption, dispatch]);

  useEffect(() => {
    if (!isFocus) {
      Keyboard.dismiss();
    }
  }, [isFocus]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            ref={filterButtonRef}
            style={{padding: 12}}
            activeOpacity={0.5}
            onPress={() => {
              Keyboard.dismiss();
              if (filterButtonRef.current) {
                filterButtonRef.current.measure(
                  (_x, _y, _width, height, _pageX, pageY) => {
                    setMenuPosition({
                      top: pageY + height,
                      right: 16,
                    });
                    setShowSortMenu(true);
                  },
                );
              }
            }}>
            <FilterListIcon width="20" height="20" fill={theme.font} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{padding: 12, paddingRight: 15}}
            activeOpacity={0.5}
            onPress={() => {
              Keyboard.dismiss();
              walletSheetRef.current && walletSheetRef.current.close();
              walletSheetRef.current && walletSheetRef.current?.present();
            }}>
            <AddIcon stroke={theme.font} style={{width: 20, height: 20}} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, theme.font, theme.background]);

  const onPressMove = useCallback(
    (index, isMoveUp) => {
      dispatch(setWalletPosition({index, isMoveUp}));
    },
    [dispatch],
  );

  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);
      if (query) {
        const newList = allWallets?.filter(item => {
          return item?.walletName
            ?.toLowerCase()
            ?.includes(query?.toLowerCase());
        });
        setSearchWallets(newList);
      } else {
        setSearchWallets([]);
      }
    },
    [allWallets],
  );

  const onDragEnd = useCallback(
    ({data, from, to}) => {
      const isMoveDown = to > from;
      dispatch(
        rearrangeWallet({
          allWallets: data,
          currentWalletIndex:
            //logic update current wallet index when we update the the positions of the wallet.
            from === currentWalletIndex
              ? to
              : isMoveDown &&
                to >= currentWalletIndex &&
                from < currentWalletIndex
              ? currentWalletIndex - 1
              : !isMoveDown &&
                to <= currentWalletIndex &&
                from > currentWalletIndex
              ? currentWalletIndex + 1
              : undefined,
        }),
      );
    },
    [currentWalletIndex, dispatch],
  );

  const handleSortSelect = useCallback(
    option => {
      dispatch(setWalletsSortOption(option));
    },
    [dispatch],
  );

  const walletSortOptions = [
    {
      label: 'Default Order',
      value: WALLET_SORT_OPTIONS.DEFAULT,
    },
    {label: 'Value: High to Low', value: WALLET_SORT_OPTIONS.VALUE_DESC},
    {label: 'Value: Low to High', value: WALLET_SORT_OPTIONS.VALUE_ASC},
    {label: 'Name: A to Z', value: WALLET_SORT_OPTIONS.NAME_ASC},
    {label: 'Name: Z to A', value: WALLET_SORT_OPTIONS.NAME_DESC},
  ];

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Searchbar
          placeholder="Search"
          value={searchQuery}
          style={styles.input}
          onChangeText={handleSearch}
          autoFocus={false}
          inputStyle={{minHeight: 0}}
        />

        <SortMenu
          visible={showSortMenu}
          onClose={() => setShowSortMenu(false)}
          onSelect={handleSortSelect}
          currentSort={sortOption}
          position={menuPosition}
          sortOptions={walletSortOptions}
          title="Sort Wallets"
        />

        <View style={styles.container}>
          <DraggableFlatList
            keyboardShouldPersistTaps={'always'}
            data={searchQuery ? searchWallets : allWallets}
            contentContainerStyle={{flexGrow: 1}}
            keyExtractor={item => item.walletName}
            onDragBegin={() => {
              Keyboard.dismiss();
            }}
            onDragEnd={onDragEnd}
            renderItem={({item, drag, isActive, getIndex}) => {
              const index = getIndex();
              const isSelectedWallet = item.walletName === currentWalletName;
              const totalBalance = getWalletTotalBalance(item?.coins);
              const topCoins = getTopTwoCoins(item?.coins);
              const coinsCount = getCoinsCount(item?.coins);
              const symbol = currencySymbol[localCurrency] || '$';
              const canMoveUp = index > 0;
              const canMoveDown = index < allWalletsLength - 1;
              const showMoveButtons = allWalletsLength > 1 && !searchQuery;

              return (
                <ScaleDecorator>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.walletCard,
                      isSelectedWallet && styles.walletCardSelected,
                    ]}
                    onPress={() => {
                      if (searchQuery) {
                        const foundIndex = allWallets.findIndex(
                          subItem => subItem.walletName === item.walletName,
                        );
                        if (foundIndex !== -1) {
                          dispatch(setCurrentWalletIndex(foundIndex));
                        }
                      } else {
                        dispatch(setCurrentWalletIndex(index));
                      }
                      navigation.popTo('Sidebar', {
                        screen: 'Home',
                      });
                    }}>
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        {!searchQuery && (
                          <TouchableOpacity
                            style={styles.dragHandle}
                            onLongPress={drag}
                            disabled={isActive}
                            hitSlop={{
                              top: 12,
                              right: 12,
                              bottom: 12,
                              left: 12,
                            }}>
                            <FontAwesomeIcon
                              name={'grip-vertical'}
                              size={18}
                              color={theme.gray}
                            />
                          </TouchableOpacity>
                        )}
                        <View style={styles.walletTitleContainer}>
                          <Text
                            style={[
                              styles.walletName,
                              isSelectedWallet && styles.walletNameSelected,
                            ]}
                            numberOfLines={1}>
                            {item.walletName}
                          </Text>
                          {isSelectedWallet && (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>Active</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.headerRight}>
                        {showMoveButtons && (
                          <View style={styles.moveButtons}>
                            <TouchableOpacity
                              style={styles.moveBtn}
                              disabled={!canMoveUp}
                              onPress={() => {
                                Keyboard.dismiss();
                                onPressMove(index, true);
                              }}>
                              <AntIcon
                                name={'caretup'}
                                color={canMoveUp ? theme.font : theme.gray}
                                size={14}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              disabled={!canMoveDown}
                              style={styles.moveBtn}
                              onPress={() => {
                                Keyboard.dismiss();
                                onPressMove(index, false);
                              }}>
                              <AntIcon
                                name={'caretdown'}
                                color={canMoveDown ? theme.font : theme.gray}
                                size={14}
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.settingsBtn}
                          hitSlop={{top: 8, right: 8, bottom: 8, left: 8}}
                          onPress={() =>
                            navigation.navigate('CreateWallet', {
                              walletName: item.walletName,
                              walletIndex: index,
                            })
                          }>
                          <IoniconsIcon
                            name={'ellipsis-vertical'}
                            size={20}
                            color={theme.font}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Wallet Type */}
                    <Text
                      style={[
                        styles.walletType,
                        isSelectedWallet && styles.walletTypeSelected,
                        searchQuery && styles.walletTypeNoIndent,
                      ]}
                      numberOfLines={1}>
                      {item?.isImportWalletWithPrivateKey
                        ? `${item?.coins?.[0]?.chain_display_name || ''} Wallet`
                        : 'Multi-Coin Wallet'}
                    </Text>

                    {/* Balance Section */}
                    <View style={styles.balanceSection}>
                      <View style={styles.balanceInfo}>
                        <Text
                          style={[
                            styles.balanceLabel,
                            isSelectedWallet && styles.balanceLabelSelected,
                          ]}>
                          Total Balance
                        </Text>
                        <Text
                          style={[
                            styles.balanceValue,
                            isSelectedWallet && styles.balanceValueSelected,
                          ]}>
                          {symbol}
                          {formatBalance(totalBalance)}
                        </Text>
                      </View>
                      <View style={styles.coinsInfo}>
                        <View style={styles.topCoinsContainer}>
                          {topCoins.map((coin, coinIndex) => (
                            <View
                              key={coin?._id || coinIndex}
                              style={[
                                styles.coinIconWrapper,
                                coinIndex > 0 && styles.coinIconOverlap,
                                isSelectedWallet &&
                                  styles.coinIconWrapperSelected,
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
                        <Text
                          style={[
                            styles.coinsCount,
                            isSelectedWallet && styles.coinsCountSelected,
                          ]}>
                          {coinsCount} {coinsCount === 1 ? 'coin' : 'coins'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              );
            }}
          />
        </View>
        <CreateWalletSheet
          bottomSheetRef={ref => (walletSheetRef.current = ref)}
          onDismiss={() => {
            walletSheetRef.current?.close();
          }}
        />
      </View>
    </DokSafeAreaView>
  );
};

export default Wallets;
