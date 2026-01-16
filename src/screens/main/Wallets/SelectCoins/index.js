import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  SectionList,
  TouchableOpacity,
  Text,
  Pressable,
} from 'react-native';
import {Searchbar} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import Spinner from 'components/Spinner';
import Loading from 'components/Loading';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import myStyles from './SelectCoinsStyles';
import {
  fetchAllCoins,
  fetchAllSearchCoins,
  fetchAllSearchCoinsWithDebounce,
  setSearchAllCoinsLoading,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {
  selectAllActiveCurrencies,
  selectAllCoins,
  selectSearchAllCoins,
  isAllCoinsAvailable,
  isSearchAllCoinsAvailable,
  isAllCoinsLoading,
  isSearchAllCoinsLoading,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';
import {createWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  isBitcoinChain,
  validateSupportedChain,
} from 'dok-wallet-blockchain-networks/helper';
import {showToast} from 'utils/toast';

const SelectableCoinItem = memo(
  ({item, isSelected, onToggle, isDefaultCoin, theme}) => {
    const styles = myStyles(theme);
    const isToken = item?.type === 'token';
    const isBitcoin = isBitcoinChain(item?.chain_name);

    const handlePress = useCallback(() => {
      onToggle(item._id, item);
    }, [onToggle, item]);

    if (!validateSupportedChain(item?.chain_name)) {
      return null;
    }

    return (
      <TouchableOpacity style={styles.section} onPress={handlePress}>
        <View style={styles.checkboxContainer}>
          <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={isSelected ? theme.background : theme.gray}
          />
        </View>
        <CoinIcon item={item} />
        <View style={styles.list}>
          <View style={styles.box}>
            <View style={styles.item}>
              <View style={styles.rowStyle}>
                <Text style={styles.title} numberOfLines={1}>
                  {item?.symbol}
                </Text>
                {(isToken || isBitcoin) && (
                  <ChainItem chain_display_name={item?.chain_display_name} />
                )}
              </View>
              <Text style={styles.text} numberOfLines={1}>
                {item?.name}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item._id === nextProps.item._id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isDefaultCoin === nextProps.isDefaultCoin &&
      prevProps.onToggle === nextProps.onToggle
    );
  },
);

const SelectCoins = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  // Route params
  const walletName = route?.params?.walletName;
  const phrase = route?.params?.phrase;

  // Redux selectors
  const activeCurrencies = useSelector(selectAllActiveCurrencies);
  const allCoins = useSelector(selectAllCoins);
  const searchAllCoins = useSelector(selectSearchAllCoins);
  const isAvailable = useSelector(isAllCoinsAvailable);
  const isSearchCoinsAvailable = useSelector(isSearchAllCoinsAvailable);
  const isAllCoinLoading = useSelector(isAllCoinsLoading);
  const isSearchAllCoinLoading = useSelector(isSearchAllCoinsLoading);

  // Local state - combined selection state for better performance
  const [selectionState, setSelectionState] = useState(() => {
    const ids = new Set(activeCurrencies.map(coin => coin._id));
    const objects = new Map();
    activeCurrencies.forEach(coin => objects.set(coin._id, coin));
    return {ids, objects};
  });

  // Derived values for easier access
  const selectedCoins = selectionState.ids;
  const selectedCoinObjects = selectionState.objects;
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    selected: false,
    unselected: false,
  });

  // Refs for pagination (same pattern as TabAddCoins)
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
  const selectionStateRef = useRef(selectionState);
  const isAvailableRef = useRef(false);
  const isSearchCoinsAvailableRef = useRef(false);
  const lastCallTime = useRef(0);
  const isMounted = useRef(false);

  // Sync refs with state
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    selectionStateRef.current = selectionState;
  }, [selectionState]);

  useEffect(() => {
    isAvailableRef.current = isAvailable;
  }, [isAvailable]);

  useEffect(() => {
    isSearchCoinsAvailableRef.current = isSearchCoinsAvailable;
  }, [isSearchCoinsAvailable]);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchAllCoins(queryPayload.current));
    const timer = setTimeout(() => {
      isMounted.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Memoized set of default coin IDs
  const defaultCoinIds = useMemo(
    () => new Set(activeCurrencies.map(c => c._id)),
    [activeCurrencies],
  );

  // Compute base coin lists (without collapse logic for better performance)
  const {selectedList, unselectedList} = useMemo(() => {
    let coinsToProcess = [];

    if (searchQuery?.trim()) {
      // During search, use search results
      coinsToProcess = searchAllCoins || [];
    } else {
      // Get all available coins (deduplicated)
      const allAvailableCoins = new Map();
      activeCurrencies.forEach(c => allAvailableCoins.set(c._id, c));
      (allCoins || []).forEach(c => allAvailableCoins.set(c._id, c));

      // Also add any selected coins that might not be in the current lists
      selectedCoinObjects.forEach((coin, id) => {
        if (!allAvailableCoins.has(id)) {
          allAvailableCoins.set(id, coin);
        }
      });

      coinsToProcess = Array.from(allAvailableCoins.values());
    }

    // Separate into selected and unselected
    const selected = [];
    const unselected = [];

    coinsToProcess.forEach(coin => {
      if (selectedCoins.has(coin._id)) {
        selected.push(coin);
      } else {
        unselected.push(coin);
      }
    });

    return {selectedList: selected, unselectedList: unselected};
  }, [
    searchQuery,
    searchAllCoins,
    activeCurrencies,
    allCoins,
    selectedCoins,
    selectedCoinObjects,
  ]);

  // Compute sections with collapse state separate for better performance
  const sections = useMemo(
    () => [
      {
        title: 'Selected',
        key: 'selected',
        data: collapsedSections.selected ? [] : selectedList,
        count: selectedList.length,
      },
      {
        title: 'Not Selected',
        key: 'unselected',
        data: collapsedSections.unselected ? [] : unselectedList,
        count: unselectedList.length,
      },
    ],
    [selectedList, unselectedList, collapsedSections],
  );

  // Handlers
  const handleSearch = useCallback(
    query => {
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
    },
    [dispatch],
  );

  const toggleCoinSelection = useCallback((coinId, coinObject) => {
    setSelectionState(prev => {
      const newIds = new Set(prev.ids);
      const newObjects = new Map(prev.objects);

      if (newIds.has(coinId)) {
        newIds.delete(coinId);
        newObjects.delete(coinId);
      } else {
        newIds.add(coinId);
        if (coinObject) {
          newObjects.set(coinId, coinObject);
        }
      }

      return {ids: newIds, objects: newObjects};
    });
  }, []);

  const onEndReached = useCallback(async () => {
    // Prevent initial calls and debounce rapid calls
    const now = Date.now();
    if (!isMounted.current || now - lastCallTime.current < 1000) {
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

  const handleCreateWallet = useCallback(async () => {
    if (selectedCoins.size === 0) {
      showToast({
        type: 'errorToast',
        title: 'Please select at least one coin',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get selected coin objects directly from our tracked state
      const selectedCoinArray = Array.from(selectedCoinObjects.values());

      console.log('SelectCoins - selectedCoins Set size:', selectedCoins.size);
      console.log(
        'SelectCoins - selectedCoinArray count:',
        selectedCoinArray.length,
      );
      console.log(
        'SelectCoins - selectedCoinArray symbols:',
        selectedCoinArray.map(c => c.symbol),
      );

      await dispatch(
        createWallet({
          walletName,
          phrase,
          selectedCoins: selectedCoinArray,
        }),
      ).unwrap();

      navigation.reset({
        index: 0,
        routes: [{name: 'Sidebar'}],
      });
    } catch (e) {
      console.error('Error creating wallet:', e);
      showToast({
        type: 'errorToast',
        title: 'Failed to create wallet',
        message: e?.message || 'Please try again',
      });
      setIsLoading(false);
    }
  }, [
    selectedCoins,
    selectedCoinObjects,
    dispatch,
    walletName,
    phrase,
    navigation,
  ]);

  const renderItem = useCallback(
    ({item}) => (
      <SelectableCoinItem
        item={item}
        isSelected={selectedCoins.has(item._id)}
        onToggle={toggleCoinSelection}
        isDefaultCoin={defaultCoinIds.has(item._id)}
        theme={theme}
      />
    ),
    [selectedCoins, toggleCoinSelection, defaultCoinIds, theme],
  );

  const keyExtractor = useCallback(item => item._id, []);

  const toggleSection = useCallback(sectionKey => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }, []);

  const renderSectionHeader = useCallback(
    ({section}) => {
      const isCollapsed = collapsedSections[section.key];
      return (
        <Pressable
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.key)}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
            <Text style={styles.sectionHeaderCount}>({section.count})</Text>
          </View>
          <MaterialCommunityIcons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={24}
            color={theme.font}
          />
        </Pressable>
      );
    },
    [collapsedSections, toggleSection, styles, theme.font],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery?.trim() ? 'No coins found' : 'Loading coins...'}
        </Text>
      </View>
    ),
    [searchQuery, styles],
  );

  const isListLoading = isSearchAllCoinLoading || isAllCoinLoading;

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <Searchbar
          placeholder="Search coins"
          value={searchQuery}
          style={styles.searchInput}
          onChangeText={handleSearch}
        />
        {isListLoading && sections[0].count === 0 && sections[1].count === 0 ? (
          <Loading />
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={keyExtractor}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={true}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
            extraData={selectedCoins}
            ListEmptyComponent={ListEmptyComponent()}
          />
        )}
        <TouchableOpacity
          style={[
            styles.button,
            selectedCoins.size === 0 && styles.buttonDisabled,
          ]}
          onPress={handleCreateWallet}
          disabled={selectedCoins.size === 0 || isLoading}>
          <Text style={styles.buttonTitle}>
            Create Wallet ({selectedCoins.size} coins)
          </Text>
        </TouchableOpacity>
      </View>
      {isLoading && <Spinner />}
    </DokSafeAreaView>
  );
};

export default SelectCoins;
