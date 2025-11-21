import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  memo,
  useRef,
} from 'react';
import {FlatList, Keyboard, View} from 'react-native';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import myStyles from './CryptoListStyles';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {useSelector, useDispatch} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {refreshCoins} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  fetchAllCoins,
  fetchAllSearchCoins,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import CoinItem from 'components/CoinItem/CoinItem';
import {Searchbar} from 'react-native-paper';

export const CryptoList = ({
  number,
  list,
  navigation,
  showSwitch,
  onEndReached,
  searchText,
  onRefresh: OnParentRefresh,
  currentWallet,
  showSearch,
  contentContainerStyle,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const localCurrency = useSelector(getLocalCurrency);
  const [renderList, setRenderList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const dispatch = useDispatch();
  const previousWalletName = useRef('');

  useEffect(() => {
    if (currentWallet?.walletName !== previousWalletName.current) {
      previousWalletName.current = currentWallet?.walletName;
      setSearchQuery('');
    }
  }, [currentWallet?.walletName]);

  useEffect(() => {
    if (searchQuery?.trim()) {
      const newList = list?.filter(item => {
        return (
          item?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
          item?.symbol?.toUpperCase()?.includes(searchQuery?.toUpperCase())
        );
      });
      setRenderList(newList);
    } else {
      setRenderList(list);
    }
  }, [list, searchQuery]);

  const handleSearch = useCallback(query => {
    setSearchQuery(query);
  }, []);

  const onRefresh = useCallback(async () => {
    OnParentRefresh && OnParentRefresh();
    setIsRefreshing(true);
    if (number === 1) {
      await dispatch(refreshCoins()).unwrap();
    } else if (number === 3) {
      const payload = {
        limit: 20,
        orderBy: 'order',
        order: 1,
        page: 1,
      };
      if (searchText) {
        payload.search = searchText;
        await dispatch(fetchAllSearchCoins(payload)).unwrap();
      } else {
        await dispatch(fetchAllCoins(payload)).unwrap();
      }
    }
    setIsRefreshing(false);
  }, [OnParentRefresh, dispatch, number, searchText]);

  const onScrollBeginDrag = useCallback(() => {
    Keyboard.dismiss();
  }, []);
  const flatlistProps = {
    style: styles.mainContainer,
    contentContainerStyle: [styles.contentContainer, contentContainerStyle],
    extraData: list,
    data: renderList,
    keyExtractor: item => item?._id,
    onRefresh: onRefresh,
    refreshing: isRefreshing,
    onEndReached: onEndReached,
    renderItem: ({item, index}) => {
      return (
        <CoinItem
          item={item}
          index={index}
          number={number}
          dispatch={dispatch}
          currentWallet={currentWallet}
          navigation={navigation}
          localCurrency={localCurrency}
          setRenderList={setRenderList}
          showSwitch={showSwitch}
        />
      );
    },
    ...(number === 1 &&
      showSearch && {
        ListHeaderComponent: (
          <SearchComponent
            handleSearch={handleSearch}
            searchQuery={searchQuery}
          />
        ),
        keyboardShouldPersistTaps: 'always',
        onScrollBeginDrag: onScrollBeginDrag,
      }),
  };

  return number === 3 ? (
    <BottomSheetFlatList {...flatlistProps} />
  ) : (
    <FlatList {...flatlistProps} />
  );
};

const SearchComponent = memo(({searchQuery, handleSearch}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  return (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder="Search"
        value={searchQuery}
        style={styles.input}
        onChangeText={handleSearch}
        inputStyle={{
          minHeight: 50,
        }}
      />
    </View>
  );
});
