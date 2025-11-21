import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import {View} from 'react-native';
import myStyles from './TabAddCoinsGroupStyles';
import {useDispatch, useSelector} from 'react-redux';
import {Searchbar} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';

import {
  fetchAllSearchCoinsGroup,
  fetchAllSearchCoinsGroupWithDebounce,
  fetchGroupCoins,
  setSearchGroupCoinsLoading,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {
  isAllGroupCoinAvailable,
  isGroupCoinsLoading,
  isSearchAllGroupCoinsLoading,
  isSearchIsAllGroupCoinAvailable,
  selectAllCoinsGroup,
  selectSearchAllCoinsGroup,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';
import Loading from 'components/Loading';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CoinsGroupList} from 'components/CoinGroupList';

const TabAddCoinGroups = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const allCoinGroups = useSelector(selectAllCoinsGroup);
  const searchAllCoinGroups = useSelector(selectSearchAllCoinsGroup);
  const isAvailable = useSelector(isAllGroupCoinAvailable);
  const isSearchGroupCoinsAvailable = useSelector(
    isSearchIsAllGroupCoinAvailable,
  );
  const isAllCoinLoading = useSelector(isGroupCoinsLoading);
  const isSearchAllGroupCoinLoading = useSelector(isSearchAllGroupCoinsLoading);
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
    dispatch(fetchGroupCoins(queryPayload.current));
  }, [dispatch]);

  const handleSearch = query => {
    setSearchQuery(query);
    if (query.trim()) {
      dispatch(setSearchGroupCoinsLoading(true));
      searchQueryPayload.current = {
        ...searchQueryPayload.current,
        page: 1,
        search: query,
      };
      dispatch(
        fetchAllSearchCoinsGroupWithDebounce(searchQueryPayload.current),
      );
    }
  };
  const onEndReached = useCallback(async () => {
    if (!isFetching.current && isAvailable && !searchQuery?.trim()) {
      isFetching.current = true;
      queryPayload.current = {
        ...queryPayload.current,
        page: queryPayload.current.page + 1,
      };
      await dispatch(fetchGroupCoins(queryPayload.current)).unwrap();
      isFetching.current = false;
    } else if (
      !isSearchFetching.current &&
      isSearchGroupCoinsAvailable &&
      searchQuery?.trim()
    ) {
      isSearchFetching.current = true;
      searchQueryPayload.current = {
        ...searchQueryPayload.current,
        page: searchQueryPayload.current.page + 1,
        search: searchQuery.trim(),
      };
      await dispatch(
        fetchAllSearchCoinsGroup(searchQueryPayload.current),
      ).unwrap();
      isSearchFetching.current = false;
    }
  }, [dispatch, isAvailable, isSearchGroupCoinsAvailable, searchQuery]);

  return (
    <View style={styles.modalView}>
      <Searchbar
        placeholder="Search"
        value={searchQuery}
        style={styles.input}
        onChangeText={handleSearch}
      />
      {isSearchAllGroupCoinLoading || isAllCoinLoading ? (
        <Loading />
      ) : (
        <CoinsGroupList
          list={searchQuery?.trim() ? searchAllCoinGroups : allCoinGroups}
          onEndReached={onEndReached}
          onRefresh={() => {
            queryPayload.current = {
              ...queryPayload.current,
              page: 1,
            };
          }}
          contentContainerStyle={{paddingBottom: bottom}}
        />
      )}
    </View>
  );
};

export default TabAddCoinGroups;
