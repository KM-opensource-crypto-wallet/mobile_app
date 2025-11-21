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

import {ThemeContext} from 'theme/ThemeContext';
import CreateWalletSheet from 'components/CreateWalletSheet';
import AddIcon from 'assets/images/sidebarIcons/Add.svg';
import {
  getCurrentWalletIndex,
  selectAllWallets,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  rearrangeWallet,
  setCurrentWalletIndex,
  setWalletPosition,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {Searchbar} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const Wallets = ({navigation}) => {
  const currentWalletName = useSelector(selectCurrentWallet)?.walletName;
  const allWallets = useSelector(selectAllWallets);
  const currentWalletIndex = useSelector(getCurrentWalletIndex);
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

  useEffect(() => {
    if (!isFocus) {
      Keyboard.dismiss();
    }
  }, [isFocus]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{padding: 15, paddingRight: 15}}
          activeOpacity={0.5}
          onPress={() => {
            Keyboard.dismiss();
            walletSheetRef.current && walletSheetRef.current.close();
            walletSheetRef.current && walletSheetRef.current?.present();
          }}>
          <AddIcon stroke={theme.font} style={{width: 20, height: 20}} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme.font]);

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
              return (
                <ScaleDecorator>
                  <View style={styles.walletBox}>
                    <TouchableOpacity
                      style={styles.walletList}
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
                        navigation.navigate('Home');
                      }}>
                      {!searchQuery && (
                        <TouchableOpacity
                          onLongPress={drag}
                          disabled={isActive}
                          hitSlop={{top: 12, right: 12, bottom: 12, left: 12}}>
                          <FontAwesomeIcon
                            name={'grip-vertical'}
                            size={24}
                            color={theme.font}
                          />
                        </TouchableOpacity>
                      )}
                      <View style={styles.textContainer}>
                        <View>
                          <Text
                            style={[
                              styles.mainText,
                              isSelectedWallet && {
                                color: theme.background,
                                fontWeight: 'bold',
                              },
                            ]}
                            numberOfLines={1}>
                            {item.walletName}
                          </Text>
                          {/*{item.walletName === currentWalletName && (*/}
                          {/*  <Badge style={styles.badge}>&#10004;</Badge>*/}
                          {/*)}*/}
                        </View>
                        <Text
                          style={[
                            styles.secondaryText,
                            isSelectedWallet && {
                              color: theme.font,
                              fontWeight: 'bold',
                            },
                          ]}
                          numberOfLines={1}>
                          {item?.isImportWalletWithPrivateKey
                            ? `${
                                item?.coins?.[0]?.chain_display_name || ''
                              } Wallet`
                            : 'Multi - Coin Wallet'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {allWalletsLength > 1 && !searchQuery && (
                      <>
                        <TouchableOpacity
                          style={styles.boxBtn}
                          disabled={index === 0}
                          onPress={() => {
                            Keyboard.dismiss();
                            onPressMove(index, true);
                          }}>
                          <AntIcon
                            name={'upcircle'}
                            color={index > 0 ? theme.font : theme.gray}
                            size={24}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={index === allWalletsLength - 1}
                          style={styles.boxBtn}
                          onPress={() => {
                            Keyboard.dismiss();
                            onPressMove(index, false);
                          }}>
                          <AntIcon
                            name={'downcircle'}
                            color={
                              index < allWalletsLength - 1
                                ? theme.font
                                : theme.gray
                            }
                            size={24}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      style={styles.boxBtn}
                      onPress={() =>
                        navigation.navigate('CreateWallet', {
                          walletName: item.walletName,
                          walletIndex: index,
                        })
                      }>
                      <IoniconsIcon
                        name={'ellipsis-vertical'}
                        size={24}
                        color={theme.font}
                      />
                    </TouchableOpacity>
                  </View>
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
