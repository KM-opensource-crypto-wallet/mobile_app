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

import {ThemeContext} from 'theme/ThemeContext';
import {
  selectCurrentCoin,
  selectTransactionsByType,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {refreshCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  getAddressDetailsUrl,
  isBitcoinChain,
  isPendingTransactionSupportedChain,
} from 'dok-wallet-blockchain-networks/helper';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import Loading from 'components/Loading';
import {inAppBrowserOptions} from 'utils/common';
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
  const [hideSmallTx, setHideSmallTx] = useState(false);
  const navigation = useNavigation();

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

  const coinId = useMemo(() => {
    return currentCoin?._id + currentCoin?.name + currentCoin?.chain_name;
  }, [currentCoin]);

  useEffect(() => {
    if (currentCoin?.address) {
      dispatch(refreshCurrentCoin({fetchTransaction: true}))
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
    setRenderList(typedTransactions);
  }, [typedTransactions]);

  const onPressViewAll = useCallback(() => {
    const chain_name = currentCoin?.chain_name;
    const type = currentCoin?.type;
    const tempAddress = currentCoin?.address;
    if (chain_name && type && tempAddress) {
      const url = getAddressDetailsUrl(chain_name, type, tempAddress);
      if (url) {
        InAppBrowser.open(url, inAppBrowserOptions).then();
      }
    }
  }, [currentCoin?.address, currentCoin?.chain_name, currentCoin?.type]);

  const onPressUpdateTransaction = useCallback(() => {
    navigation.navigate('UpdateTransaction');
  }, [navigation]);

  const onPressApply = useCallback(
    (sortValue, filterValue, hideSmallTxValue) => {
      const mineAddress = currentCoin?.address;
      setSort(sortValue);
      setFilter(filterValue);
      setHideSmallTx(hideSmallTxValue);
      const allTempTransactions = Array.isArray(typedTransactions)
        ? [...typedTransactions]
        : [];
      const parseTransaction = JSON.parse(JSON.stringify(allTempTransactions));

      const filterTempTransactions = parseTransaction.filter(mainTran => {
        if (filterValue === 'Received') {
          if (mineAddress?.toUpperCase() !== mainTran?.to?.toUpperCase()) {
            return false;
          }
        } else if (filterValue === 'Send') {
          if (mineAddress?.toUpperCase() !== mainTran?.from?.toUpperCase()) {
            return false;
          }
        } else if (filterValue === 'Pending') {
          if (mainTran.status?.toUpperCase() === 'SUCCESS') {
            return false;
          }
        }
        if (
          hideSmallTxValue &&
          currentCoin?.currencyRate &&
          currentCoin?.decimal &&
          mainTran.transactionType !== 'stake' &&
          mainTran.transactionType !== 'unstake'
        ) {
          const usdValue =
            Number(mainTran.amount) * Number(currentCoin.currencyRate);
          if (usdValue < 1) {
            return false;
          }
        }
        return true;
      });
      const sortedData = filterTempTransactions?.sort(function (a, b) {
        if (sortValue === 'Date Descending') {
          return new Date(b.date) - new Date(a.date);
        } else if (sortValue === 'Date Ascending') {
          return new Date(a.date) - new Date(b.date);
        } else if (sortValue === 'Amount Ascending') {
          return Number(a.amount) - Number(b.amount);
        } else if (sortValue === 'Amount Descending') {
          return Number(b.amount) - Number(a.amount);
        }
      });

      setRenderList(sortedData);
    },
    [currentCoin, typedTransactions],
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
    setHideSmallTx(false);
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
            <View style={styles.box}>
              <View style={styles.rowView}>
                <Text style={styles.titleTrans}>Transactions</Text>
                {isSupportUpdateTransaction && (
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={onPressUpdateTransaction}>
                    <Text style={styles.viewButtonText}>
                      {'Update transaction'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.rowView}>
                <Text style={styles.address} numberOfLines={1}>
                  Your last 20 transactions
                </Text>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={onPressViewAll}>
                  <Text style={styles.viewButtonText}>{'View all'}</Text>
                </TouchableOpacity>
              </View>
            </View>
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

            <View style={styles.borderBox}>
              <View style={styles.sortList}>
                <View>
                  <Text>
                    <Text style={styles.sortTitle}>Sort by:</Text>
                    <Text style={styles.titleItem}>{sort}</Text>
                  </Text>
                  {filter !== 'None' && (
                    <Text>
                      <Text style={styles.sortTitle}>Filter by:</Text>
                      <Text style={styles.titleItem}>{filter}</Text>
                    </Text>
                  )}
                  {hideSmallTx && (
                    <Text>
                      <Text style={styles.sortTitle}>Hiding:</Text>
                      <Text style={styles.titleItem}>{'< $1'}</Text>
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <FilterIcon height="30" width="30" fill={theme.font} />
                </TouchableOpacity>
              </View>
            </View>
            <Transactions renderList={renderList} selectedAddress={address} />
          </ScrollView>
        )}
      </DokSafeAreaView>
      <SortTransactions
        visible={modalVisible}
        hideModal={setModalVisible}
        onPressAppy={onPressApply}
      />
    </>
  );
};

export default TransactionList;
