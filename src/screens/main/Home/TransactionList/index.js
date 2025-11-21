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
import {Provider, Portal} from 'react-native-paper';
import FilterIcon from 'assets/images/icons/filter-list.svg';

import {ThemeContext} from 'theme/ThemeContext';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {refreshCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  getAddressDetailsUrl,
  isPendingTransactionSupportedChain,
} from 'dok-wallet-blockchain-networks/helper';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import Loading from 'components/Loading';
import {inAppBrowserOptions} from 'utils/common';
import {useNavigation} from '@react-navigation/native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const TransactionList = () => {
  const currentCoin = useSelector(selectCurrentCoin);
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const allTransactions = currentCoin?.transactions;
  const [modalVisible, setModalVisible] = useState(false);
  const [sort, setSort] = useState('Date Descending');
  const [filter, setFilter] = useState('None');
  const [renderList, setRenderList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  const isSupportUpdateTransaction = useMemo(() => {
    return (
      isPendingTransactionSupportedChain(currentCoin?.chain_name) &&
      currentCoin?.type === 'coin'
    );
  }, [currentCoin?.chain_name, currentCoin?.type]);

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
        .catch(e => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinId, dispatch]);

  const address = currentCoin?.address;

  useEffect(() => {
    setRenderList(allTransactions);
  }, [allTransactions]);

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
    (sortValue, filterValue) => {
      const mineAddress = currentCoin?.address;
      setSort(sortValue);
      setFilter(filterValue);
      const allTempTransactions = Array.isArray(allTransactions)
        ? [...allTransactions]
        : [];
      const parseTransaction = JSON.parse(JSON.stringify(allTempTransactions));

      const filterTempTransactions = parseTransaction.filter(mainTran => {
        if (filterValue === 'None') {
          return true;
        } else if (filterValue === 'Received') {
          return mineAddress?.toUpperCase() === mainTran?.to?.toUpperCase();
        } else if (filterValue === 'Send') {
          return mineAddress?.toUpperCase() === mainTran?.from?.toUpperCase();
        } else if (filterValue === 'Pending') {
          return mainTran.status?.toUpperCase() !== 'SUCCESS';
        }
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
      // const
    },
    [currentCoin?.address, allTransactions],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(refreshCurrentCoin({fetchTransaction: true})).unwrap();
    setRefreshing(false);
  }, [dispatch]);

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
