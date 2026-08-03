import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import myStyles from './TransactionListStyles';
import {useSelector, useDispatch} from 'react-redux';
import Transactions from 'components/Transactions';
import SortTransactions from 'components/SortTransactions';
import FilterIcon from 'assets/images/icons/filter-list.svg';
import IoniconIcon from 'react-native-vector-icons/Ionicons';

import {ThemeContext} from 'theme/ThemeContext';
import {
  selectCurrentCoin,
  selectTransactionsByType,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getHideSmallTransactions} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {setHideSmallTransactions} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {refreshCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  getAddressDetailsUrl,
  isBitcoinChain,
  isPendingTransactionSupportedChain,
  isTransactionListLimit100,
} from 'dok-wallet-blockchain-networks/helper';
import Loading from 'components/Loading';
import {inAppBrowserOptions} from 'utils/common';
import {openInAppBrowser} from 'utils/inAppBrowser';
import {useNavigation} from '@react-navigation/native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const ALL_TRANSACTION_TYPES = [
  {label: 'All', value: 'all'},
  {label: 'Regular', value: 'regular'},
  {label: 'Stake', value: 'stake'},
  {label: 'Unstake', value: 'unstake'},
  {label: 'Withdraw', value: 'withdraw'},
  {label: 'Batch', value: 'batch'},
];

const TransactionList = () => {
  const currentCoin = useSelector(selectCurrentCoin);
  const hideSmallTransactions = useSelector(getHideSmallTransactions);
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [sort, setSort] = useState('Date Descending');
  const [filter, setFilter] = useState('None');
  // const allTransactions = currentCoin?.transactions;
  const [selectedType, setSelectedType] = useState('all');
  const [renderList, setRenderList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hideSmallTx, setHideSmallTx] = useState(hideSmallTransactions ?? true);
  const [showInfo, setShowInfo] = useState(false);
  const navigation = useNavigation();

  const isSupport100tx = useMemo(() => {
    return isTransactionListLimit100(currentCoin?.chain_name);
  }, [currentCoin?.chain_name]);

  const transactionsSelector = useMemo(
    () => selectTransactionsByType(selectedType),
    [selectedType],
  );
  const typedTransactions = useSelector(transactionsSelector);

  const isSupportUpdateTransaction = useMemo(() => {
    return (
      isPendingTransactionSupportedChain(currentCoin?.chain_name) &&
      currentCoin?.type === 'coin'
    );
  }, [currentCoin?.chain_name, currentCoin?.type]);

  const transactionTypes = useMemo(() => {
    const chain = currentCoin?.chain_name;
    if (chain === 'tron') {
      return ALL_TRANSACTION_TYPES.filter(t => t.value !== 'batch');
    }
    if (chain === 'solana') {
      return ALL_TRANSACTION_TYPES.filter(t =>
        ['all', 'stake', 'unstake', 'withdraw'].includes(t.value),
      );
    }
    const ALL_ONLY_CHAINS = [
      'ton',
      'stellar',
      'aptos',
      'cardano',
      'cosmos',
      'filecoin',
      'hedera',
      'polkadot',
      'ripple',
      'tezos',
      'thorchain',
      'bitcoin_lightning',
      'litecoin',
      'dogecoin',
      'bitcoin_cash',
    ];
    if (ALL_ONLY_CHAINS.includes(chain) || isBitcoinChain(chain)) {
      return ALL_TRANSACTION_TYPES.filter(t => t.value === 'all');
    }
    return ALL_TRANSACTION_TYPES;
  }, [currentCoin?.chain_name]);

  const dispatch = useDispatch();

  const computeRenderList = useCallback(
    (transactions, sortValue, filterValue, hideSmallTxValue) => {
      const mineAddress = currentCoin?.address;
      const currencyRate = currentCoin?.currencyRate;
      const list = Array.isArray(transactions) ? [...transactions] : [];

      const filtered = list.filter(tx => {
        if (filterValue === 'Received') {
          if (mineAddress?.toUpperCase() !== tx?.to?.toUpperCase()) {
            return false;
          }
        } else if (filterValue === 'Send') {
          if (mineAddress?.toUpperCase() !== tx?.from?.toUpperCase()) {
            return false;
          }
        } else if (filterValue === 'Pending') {
          if (tx.status?.toUpperCase() === 'SUCCESS') {
            return false;
          }
        }
        if (
          hideSmallTxValue &&
          currencyRate &&
          tx.transactionType === 'regular'
        ) {
          const usdValue = Number(tx.amount) * Number(currencyRate);
          if (usdValue < 1) {
            return false;
          }
        }
        return true;
      });

      return filtered.sort((a, b) => {
        if (sortValue === 'Date Descending') {
          return new Date(b.date) - new Date(a.date);
        }
        if (sortValue === 'Date Ascending') {
          return new Date(a.date) - new Date(b.date);
        }
        if (sortValue === 'Amount Ascending') {
          return Number(a.amount) - Number(b.amount);
        }
        if (sortValue === 'Amount Descending') {
          return Number(b.amount) - Number(a.amount);
        }
        return 0;
      });
    },
    [currentCoin?.address, currentCoin?.currencyRate],
  );

  const coinId = useMemo(() => {
    return currentCoin?._id + currentCoin?.name + currentCoin?.chain_name;
  }, [currentCoin]);

  useEffect(() => {
    if (currentCoin?.address) {
      dispatch(
        refreshCurrentCoin({fetchTransaction: true, isFetchDelegation: true}),
      )
        .unwrap()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinId, dispatch]);

  const address = currentCoin?.address;

  useEffect(() => {
    setRenderList(
      computeRenderList(typedTransactions, sort, filter, hideSmallTx),
    );
  }, [typedTransactions, sort, filter, hideSmallTx, computeRenderList]);

  const onPressViewAll = useCallback(() => {
    const chain_name = currentCoin?.chain_name;
    const type = currentCoin?.type;
    const tempAddress = currentCoin?.address;
    if (chain_name && type && tempAddress) {
      const url = getAddressDetailsUrl(chain_name, type, tempAddress);
      if (url) {
        openInAppBrowser(url, inAppBrowserOptions).then();
      }
    }
  }, [currentCoin?.address, currentCoin?.chain_name, currentCoin?.type]);

  const onPressUpdateTransaction = useCallback(() => {
    navigation.navigate('UpdateTransaction');
  }, [navigation]);

  const onPressApply = useCallback(
    (sortValue, filterValue, hideSmallTxValue) => {
      setSort(sortValue);
      setFilter(filterValue);
      setHideSmallTx(hideSmallTxValue);
      dispatch(setHideSmallTransactions(hideSmallTxValue));
    },
    [dispatch],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(refreshCurrentCoin({fetchTransaction: true})).unwrap();
    setRefreshing(false);
  }, [dispatch]);

  const onPressTypeTab = useCallback(value => {
    setSelectedType(value);
    setSort('Date Descending');
    setFilter('None');
  }, []);

  if (!currentCoin) {
    return null;
  }
  return (
    <>
      <DokSafeAreaView style={styles.container}>
        {isLoading ? (
          <Loading />
        ) : (
          <ScrollView
            contentContainerStyle={styles.containerContainerStyle}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.titleTrans}>Transactions</Text>
                <TouchableOpacity
                  style={styles.subtitleRow}
                  onPress={() => setShowInfo(v => !v)}
                  activeOpacity={0.7}>
                  <Text style={styles.subtitle}>{`Your last ${
                    isSupport100tx ? '100' : '20'
                  } transactions`}</Text>
                  <IoniconIcon
                    name={
                      showInfo
                        ? 'information-circle'
                        : 'information-circle-outline'
                    }
                    size={14}
                    color={theme.gray}
                    style={styles.infoIcon}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.headerActions}>
                {isSupportUpdateTransaction && (
                  <TouchableOpacity
                    style={styles.updateBtn}
                    onPress={onPressUpdateTransaction}>
                    <IoniconIcon
                      name="refresh-outline"
                      size={13}
                      color={theme.background}
                    />
                    <Text style={styles.updateBtnText}>Update</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={onPressViewAll}>
                  <Text style={styles.viewAllText}>View all</Text>
                  <IoniconIcon
                    name="open-outline"
                    size={13}
                    color={theme.background}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info card */}
            {showInfo && (
              <View style={styles.infoCard}>
                <IoniconIcon
                  name="information-circle"
                  size={16}
                  color={theme.background}
                />
                <View style={styles.infoCardBody}>
                  <Text style={styles.infoCardTitle}>
                    Why are some transactions missing?
                  </Text>
                  <Text style={styles.infoCardLine}>
                    {`• Only the last ${
                      isSupport100tx ? '100' : '20'
                    } transactions are fetched.`}
                  </Text>
                  <Text style={styles.infoCardLine}>
                    {'• Regular transfers under $1 are hidden (toggle in '}
                    <Text style={styles.infoCardBold}>Sort & Filter</Text>
                    {').'}
                  </Text>
                  <Text style={styles.infoCardLine}>
                    {
                      '• A status filter (Send / Received / Pending) may be active.'
                    }
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowInfo(false);
                      onPressViewAll();
                    }}>
                    <Text style={styles.infoCardLink}>
                      {'Tap "View all" to see your full history →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Type filter tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeFilterScrollView}
              contentContainerStyle={styles.typeFilterRow}>
              {transactionTypes.map(item => {
                const isActive = selectedType === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={
                      isActive
                        ? styles.typeFilterTabActive
                        : styles.typeFilterTab
                    }
                    onPress={() => onPressTypeTab(item.value)}>
                    <Text
                      numberOfLines={1}
                      style={
                        isActive
                          ? styles.typeFilterTabTextActive
                          : styles.typeFilterTabText
                      }>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sort / filter bar */}
            <View style={styles.sortBar}>
              <View style={styles.sortLeft}>
                <IoniconIcon
                  name="swap-vertical-outline"
                  size={14}
                  color={theme.gray}
                />
                <Text style={styles.sortText}>{sort}</Text>
                {filter !== 'None' && (
                  <>
                    <Text style={styles.sortDot}>·</Text>
                    <Text style={styles.sortText}>{filter}</Text>
                  </>
                )}
                {hideSmallTx && (
                  <>
                    <Text style={styles.sortDot}>·</Text>
                    <Text style={styles.sortText}>{'< $1 hidden'}</Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                style={styles.filterIconBtn}
                onPress={() => setModalVisible(true)}>
                <FilterIcon height="20" width="20" fill={theme.font} />
              </TouchableOpacity>
            </View>
            <Transactions renderList={renderList} selectedAddress={address} />
          </ScrollView>
        )}
      </DokSafeAreaView>
      <SortTransactions
        visible={modalVisible}
        hideModal={setModalVisible}
        onPressAppy={onPressApply}
        currentSort={sort}
        currentFilter={filter}
        currentHideSmallTx={hideSmallTx}
      />
    </>
  );
};

export default TransactionList;
