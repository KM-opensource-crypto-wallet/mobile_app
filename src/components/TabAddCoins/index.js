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
  const searchQueryRef = useRef('');
  const isAvailableRef = useRef(false);
  const isSearchCoinsAvailableRef = useRef(false);
  const lastCallTime = useRef(0);
  const isMounted = useRef(false);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    isAvailableRef.current = isAvailable;
  }, [isAvailable]);

  useEffect(() => {
    isSearchCoinsAvailableRef.current = isSearchCoinsAvailable;
  }, [isSearchCoinsAvailable]);

  useEffect(() => {
    dispatch(fetchAllCoins(queryPayload.current));
    // Mark as mounted after a short delay to prevent initial onEndReached calls
    const timer = setTimeout(() => {
      isMounted.current = true;
    }, 500);
    return () => clearTimeout(timer);
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
    // Prevent initial calls and debounce rapid calls
    const now = Date.now();
    if (!isMounted.current || now - lastCallTime.current < 1000) {
      console.log('onEndReached ignored - too soon or not mounted');
      return;
    }

    lastCallTime.current = now;

    if (
      !isFetching.current &&
      isAvailableRef.current &&
      !searchQueryRef.current?.trim()
    ) {
      isFetching.current = true;
      queryPayload.current = {
        ...queryPayload.current,
        page: queryPayload.current.page + 1,
      };
      await dispatch(fetchAllCoins(queryPayload.current)).unwrap();
      isFetching.current = false;
    } else if (
      !isSearchFetching.current &&
      isSearchCoinsAvailableRef.current &&
      searchQueryRef.current?.trim()
    ) {
      isSearchFetching.current = true;
      searchQueryPayload.current = {
        ...searchQueryPayload.current,
        page: searchQueryPayload.current.page + 1,
        search: searchQueryRef.current.trim(),
      };
      await dispatch(fetchAllSearchCoins(searchQueryPayload.current)).unwrap();
      isSearchFetching.current = false;
    }
  }, [dispatch]);

  return (
    <View style={styles.modalView}>
      <Searchbar
        placeholder="Search"
        value={searchQuery}
        style={styles.input}
        onChangeText={handleSearch}
        autoCorrect={false}
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
