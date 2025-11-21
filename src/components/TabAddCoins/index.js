import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import {View} from 'react-native';
import myStyles from './TabAddCoinsStyles';
import {CryptoList} from 'components/CryptoList';
import {useDispatch, useSelector} from 'react-redux';
import {Searchbar} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';

import {
  fetchAllCoins,
  fetchAllSearchCoins,
  fetchAllSearchCoinsWithDebounce,
  setSearchAllCoinsLoading,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {
  isAllCoinsAvailable,
  isAllCoinsLoading,
  isSearchAllCoinsAvailable,
  isSearchAllCoinsLoading,
  selectAllCoins,
  selectSearchAllCoins,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';
import Loading from 'components/Loading';
import {selectCurrentWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const TabAddCoins = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const allCoins = useSelector(selectAllCoins);
  const searchAllCoins = useSelector(selectSearchAllCoins);
  const isAvailable = useSelector(isAllCoinsAvailable);
  const isSearchCoinsAvailable = useSelector(isSearchAllCoinsAvailable);
  const isAllCoinLoading = useSelector(isAllCoinsLoading);
  const isSearchAllCoinLoading = useSelector(isSearchAllCoinsLoading);
  const currentWallet = useSelector(selectCurrentWallet);
  const dispatch = useDispatch();
  const {bottom} = useSafeAreaInsets();
  const queryPayload = useRef({
    limit: 20,
    orderBy: 'order',
    order: 1,
    page: 1,
  });
  const searchQueryPayload = useRef({
    limit: 20,
    orderBy: 'order',
    order: 1,
    page: 1,
  });
  const isFetching = useRef(false);
  const isSearchFetching = useRef(false);

  useEffect(() => {
    dispatch(fetchAllCoins(queryPayload.current));
  }, [dispatch]);

  const handleSearch = query => {
    setSearchQuery(query);
    if (query.trim()) {
      dispatch(setSearchAllCoinsLoading(true));
      searchQueryPayload.current = {
        ...searchQueryPayload.current,
        page: 1,
        search: query,
      };
      dispatch(fetchAllSearchCoinsWithDebounce(searchQueryPayload.current));
    }
  };

  const onEndReached = useCallback(async () => {
    if (!isFetching.current && isAvailable && !searchQuery?.trim()) {
      isFetching.current = true;
      queryPayload.current = {
        ...queryPayload.current,
        page: queryPayload.current.page + 1,
      };
      await dispatch(fetchAllCoins(queryPayload.current)).unwrap();
      isFetching.current = false;
    } else if (
      !isSearchFetching.current &&
      isSearchCoinsAvailable &&
      searchQuery?.trim()
    ) {
      isSearchFetching.current = true;
      searchQueryPayload.current = {
        ...searchQueryPayload.current,
        page: searchQueryPayload.current.page + 1,
        search: searchQuery.trim(),
      };
      await dispatch(fetchAllSearchCoins(searchQueryPayload.current)).unwrap();
      isSearchFetching.current = false;
    }
  }, [dispatch, isAvailable, isSearchCoinsAvailable, searchQuery]);

  return (
    <View style={styles.modalView}>
      <Searchbar
        placeholder="Search"
        value={searchQuery}
        style={styles.input}
        onChangeText={handleSearch}
      />
      {isSearchAllCoinLoading || isAllCoinLoading ? (
        <Loading />
      ) : (
        <CryptoList
          number={3}
          list={searchQuery?.trim() ? searchAllCoins : allCoins}
          showSwitch={true}
          onEndReached={onEndReached}
          onRefresh={() => {
            queryPayload.current = {
              ...queryPayload.current,
              page: 1,
            };
          }}
          searchText={searchQuery.trim()}
          currentWallet={currentWallet}
          contentContainerStyle={{paddingBottom: bottom}}
        />
      )}
    </View>
  );
};

export default TabAddCoins;
