import React, {useCallback, useContext, useEffect, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import Loading from 'components/Loading';
import EmptyView from 'components/EmptyView';
import ExchangeTransactionItem from 'components/ExchangeHistory/ExchangeTransactionItem';
import {
  fetchExchangeTransactions,
  fetchMoreExchangeTransactions,
} from 'dok-wallet-blockchain-networks/redux/exchangeHistory/exchangeHistorySlice';
import {
  selectExchangeTransactions,
  selectExchangeHistoryLoading,
  selectExchangeHistoryRefreshing,
  selectExchangeHistoryLoadingMore,
  selectExchangeHistoryError,
} from 'dok-wallet-blockchain-networks/redux/exchangeHistory/exchangeHistorySelectors';
import {selectCurrentWalletClientId} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import myStyles from './ExchangeTransactionsStyles';

// Swap history for the current wallet: newest first, pull-to-refresh,
// infinite scroll. The backend refreshes pending statuses on each fetch.
const ExchangeTransactions = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  const transactions = useSelector(selectExchangeTransactions);
  const loading = useSelector(selectExchangeHistoryLoading);
  const refreshing = useSelector(selectExchangeHistoryRefreshing);
  const loadingMore = useSelector(selectExchangeHistoryLoadingMore);
  const error = useSelector(selectExchangeHistoryError);
  const walletClientId = useSelector(selectCurrentWalletClientId);
  const endReachedThrottleRef = useRef(0);

  useEffect(() => {
    dispatch(fetchExchangeTransactions());
  }, [dispatch, walletClientId]);

  const onRefresh = useCallback(() => {
    dispatch(fetchExchangeTransactions({refresh: true}));
  }, [dispatch]);

  const onEndReached = useCallback(() => {
    const now = Date.now();
    if (now - endReachedThrottleRef.current < 1000) {
      return;
    }
    endReachedThrottleRef.current = now;
    dispatch(fetchMoreExchangeTransactions());
  }, [dispatch]);

  const onPressItem = useCallback(
    transaction => {
      navigation.navigate('ExchangeTransactionDetails', {
        transactionId: transaction?._id,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}) => (
      <ExchangeTransactionItem transaction={item} onPress={onPressItem} />
    ),
    [onPressItem],
  );

  const keyExtractor = useCallback(item => item?._id, []);

  if (loading && !transactions.length) {
    return <Loading />;
  }

  return (
    <DokSafeAreaView style={styles.container}>
      <FlatList
        style={styles.list}
        contentContainerStyle={
          transactions.length ? styles.listContent : styles.listContentEmpty
        }
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.background}
          />
        }
        ListEmptyComponent={
          error ? (
            <EmptyView
              text={'Could not load your swap history.'}
              buttonText={'Retry'}
              onPressButton={onRefresh}
            />
          ) : (
            <EmptyView
              text={
                'No swaps yet. Your exchange transactions will appear here.'
              }
              buttonText={'Make a swap'}
              onPressButton={() => navigation.goBack()}
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={theme.background} />
            </View>
          ) : null
        }
      />
      {!!error && transactions.length ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </DokSafeAreaView>
  );
};

export default ExchangeTransactions;
