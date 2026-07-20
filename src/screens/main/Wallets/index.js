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
  isWalletHiddenAndLocked,
  selectAllWallets,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  findHiddenWalletByCode,
  rearrangeWallet,
  setCurrentWalletIndex,
  setWalletRevealed,
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
import {
  debounce,
  formatBalance,
  getCoinsCount,
  getTopTwoCoins,
  getWalletTotalBalance,
} from 'dok-wallet-blockchain-networks/helper';
import {
  normalizeSecretCode,
  SECRET_CODE_MAX_LENGTH,
  SECRET_CODE_MIN_LENGTH,
} from 'utils/hideWallet';
import {store} from 'redux/store';

const WALLET_SORT_OPTIONS = {
  DEFAULT: 'default',
  VALUE_DESC: 'value_desc',
  VALUE_ASC: 'value_asc',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
};

const Wallets = ({navigation}) => {
  const currentWallet = useSelector(selectCurrentWallet);
  const currentWalletName = currentWallet?.walletName;
  const allWallets = useSelector(selectAllWallets);
  const localCurrency = useSelector(getLocalCurrency);
  const walletSheetRef = useRef();
  const visibleWallets = useMemo(
    () => allWallets.filter(wallet => !isWalletHiddenAndLocked(wallet)),
    [allWallets],
  );
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedReveal, setMatchedReveal] = useState(null);
  const isFocus = useIsFocused();
  const displayedWallets = useMemo(() => {
    const nameMatches = visibleWallets;
    if (!searchQuery) {
      return nameMatches;
    }
    const query = searchQuery.toLowerCase();
    const normalizedQuery = normalizeSecretCode(searchQuery);
    const filteredNameMatches = nameMatches.filter(item =>
      item?.walletName?.toLowerCase()?.includes(query),
    );
    if (matchedReveal && normalizedQuery === matchedReveal.code) {
      const matchedWallet = allWallets.find(
        item => item.walletName === matchedReveal.walletName,
      );
      // Once revealed (tapped), the wallet may already be in the name
      // matches - appending it again would duplicate the row (and its key).
      if (matchedWallet && !filteredNameMatches.includes(matchedWallet)) {
        return [...filteredNameMatches, matchedWallet];
      }
    }
    return filteredNameMatches;
  }, [searchQuery, visibleWallets, allWallets, matchedReveal]);
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
      setSearchQuery('');
      setMatchedReveal(null);
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

  const commitDisplayedOrder = useCallback(
    newDisplayedOrder => {
      let visibleCursor = 0;
      const newFullOrder = allWallets.map(wallet =>
        isWalletHiddenAndLocked(wallet)
          ? wallet
          : newDisplayedOrder[visibleCursor++],
      );
      const newCurrentWalletIndex = newFullOrder.findIndex(
        wallet =>
          (wallet?.clientId || wallet?.id) ===
          (currentWallet?.clientId || currentWallet?.id),
      );
      dispatch(
        rearrangeWallet({
          allWallets: newFullOrder,
          currentWalletIndex:
            newCurrentWalletIndex !== -1 ? newCurrentWalletIndex : undefined,
        }),
      );
      // A manual rearrange means the user is taking over the ordering. If a
      // sort option stayed active, the mount-time sortWallets dispatch would
      // silently discard this order on the next visit to this screen.
      if (sortOption !== WALLET_SORT_OPTIONS.DEFAULT) {
        dispatch(setWalletsSortOption(WALLET_SORT_OPTIONS.DEFAULT));
      }
    },
    [allWallets, currentWallet, sortOption, dispatch],
  );

  const onPressMove = useCallback(
    (visibleIndex, isMoveUp) => {
      const targetIndex = isMoveUp ? visibleIndex - 1 : visibleIndex + 1;
      if (targetIndex < 0 || targetIndex >= displayedWallets.length) {
        return;
      }
      const reordered = [...displayedWallets];
      const [moved] = reordered.splice(visibleIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      commitDisplayedOrder(reordered);
    },
    [displayedWallets, commitDisplayedOrder],
  );

  const attemptRevealByCode = useMemo(
    () =>
      debounce(async code => {
        const result = await findHiddenWalletByCode(store.getState(), code);
        setMatchedReveal(
          result?.matched
            ? {code: normalizeSecretCode(code), walletName: result.walletName}
            : null,
        );
      }, 400),
    [],
  );

  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);
      const trimmed = query?.trim() || '';
      if (
        trimmed.length >= SECRET_CODE_MIN_LENGTH &&
        trimmed.length <= SECRET_CODE_MAX_LENGTH
      ) {
        attemptRevealByCode(trimmed);
      } else {
        setMatchedReveal(null);
      }
    },
    [attemptRevealByCode],
  );

  const onDragEnd = useCallback(
    ({data}) => {
      commitDisplayedOrder(data);
    },
    [commitDisplayedOrder],
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
          onSubmitEditing={() => Keyboard.dismiss()}
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
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
            bounces={false}
            keyboardShouldPersistTaps={'always'}
            data={displayedWallets}
            contentContainerStyle={{flexGrow: 1}}
            keyExtractor={item => item.walletName}
            onDragBegin={() => {
              Keyboard.dismiss();
            }}
            onDragEnd={onDragEnd}
            renderItem={({item, drag, isActive}) => {
              const index = allWallets.findIndex(
                subItem => subItem.walletName === item.walletName,
              );
              const visibleIndex = displayedWallets.findIndex(
                subItem => subItem.walletName === item.walletName,
              );
              const isSelectedWallet = item.walletName === currentWalletName;
              const totalBalance = getWalletTotalBalance(item?.coins);
              const topCoins = getTopTwoCoins(item?.coins);
              const coinsCount = getCoinsCount(item?.coins);
              const symbol = currencySymbol[localCurrency] || '$';
              const canMoveUp = visibleIndex > 0;
              const canMoveDown = visibleIndex < displayedWallets.length - 1;
              const showMoveButtons =
                displayedWallets.length > 1 && !searchQuery;

              return (
                <ScaleDecorator>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.walletCard,
                      isSelectedWallet && styles.walletCardSelected,
                    ]}
                    onPress={() => {
                      if (index !== -1) {
                        if (isWalletHiddenAndLocked(item)) {
                          dispatch(
                            setWalletRevealed({
                              walletIndex: index,
                              isHidden: false,
                            }),
                          );
                        }
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
                                onPressMove(visibleIndex, true);
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
                                onPressMove(visibleIndex, false);
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
