import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';
import {
  isEVMChain,
  isBitcoinChain,
} from 'dok-wallet-blockchain-networks/helper';
import {SCAN_URL, config} from 'dok-wallet-blockchain-networks/config/config';
import {
  getNotificationHistory,
  getHistoryLoading,
  getHistoryHasMore,
} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSelector';
import {fetchNotificationHistoryThunk} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import myStyles from './NotificationHistoryStyles';

const getTxExplorerUrl = (chainName, txHash) => {
  if (!chainName || !txHash) return null;
  if (isEVMChain(chainName))
    return `${SCAN_URL[chainName]?.baseUrl}/tx/${txHash}`;
  if (isBitcoinChain(chainName))
    return `${config.BITCOIN_SCAN_URL}/tx/${txHash}`;
  return null;
};

const formatTime = iso =>
  new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

const formatDate = iso => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const HistoryItem = React.memo(({item, onPress, styles}) => {
  const isReceive = item.direction === 'receive';
  return (
    <TouchableOpacity style={styles.itemRow} onPress={() => onPress(item)}>
      <View
        style={[
          styles.directionIconContainer,
          isReceive ? styles.receiveIconBg : styles.sendIconBg,
        ]}>
        <Ionicons
          name={isReceive ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={isReceive ? '#16a34a' : '#dc2626'}
        />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemTopRow}>
          <Text style={styles.coinSymbol}>{item.coin || 'Token'}</Text>
          <Text
            style={[
              styles.amountText,
              isReceive ? styles.receiveAmount : styles.sendAmount,
            ]}>
            {isReceive ? '+' : '-'}
            {item.amount}
          </Text>
        </View>
        <View style={styles.itemBottomRow}>
          <Text style={styles.chainText}>{item.chainName}</Text>
          <Text style={styles.timeText}>{formatTime(item.notifiedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const NotificationHistory = () => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const dispatch = useDispatch();

  const history = useSelector(getNotificationHistory);
  const loading = useSelector(getHistoryLoading);
  const hasMore = useSelector(getHistoryHasMore);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadingMore = useRef(false);

  const load = useCallback(
    async (reset = false) => {
      await dispatch(fetchNotificationHistoryThunk({reset}));
    },
    [dispatch],
  );

  useEffect(() => {
    load(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load(true);
    setIsRefreshing(false);
  }, [load]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loading || loadingMore.current) return;
    loadingMore.current = true;
    await load(false);
    loadingMore.current = false;
  }, [hasMore, loading, load]);

  const onPressItem = useCallback(item => {
    const url = getTxExplorerUrl(item.chainName, item.txHash);
    if (url) {
      InAppBrowser.open(url, inAppBrowserOptions).then();
    }
  }, []);

  const listData = useMemo(() => {
    const result = [];
    let lastDate = null;
    for (const item of history) {
      const dateLabel = formatDate(item.notifiedAt);
      if (dateLabel !== lastDate) {
        result.push({
          type: 'separator',
          label: dateLabel,
          key: `sep_${dateLabel}`,
        });
        lastDate = dateLabel;
      }
      result.push({type: 'item', ...item, key: item._id || item.txHash});
    }
    return result;
  }, [history]);

  const renderItem = useCallback(
    ({item}) => {
      if (item.type === 'separator') {
        return <Text style={styles.dateSeparator}>{item.label}</Text>;
      }
      return <HistoryItem item={item} onPress={onPressItem} styles={styles} />;
    },
    [onPressItem, styles],
  );

  const keyExtractor = useCallback(item => item.key, []);

  const ListFooter = useCallback(
    () =>
      loading && !isRefreshing ? (
        <ActivityIndicator
          size="small"
          color={theme.primary}
          style={styles.footerLoader}
        />
      ) : null,
    [loading, isRefreshing, theme.primary, styles.footerLoader],
  );

  return (
    <View style={styles.container}>
      {loading && !isRefreshing && listData.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.flatlistContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No notification history for this wallet
            </Text>
          }
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
        />
      )}
    </View>
  );
};

export default NotificationHistory;
