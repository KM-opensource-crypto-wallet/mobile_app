import {ThemeContext} from 'theme/ThemeContext';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {useDispatch, useSelector} from 'react-redux';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {refreshCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {currencySymbol} from 'data/currency';
import Clipboard from '@react-native-clipboard/clipboard';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';
import {showToast} from 'utils/toast';
import dayjs from 'dayjs';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import SendIcon from 'assets/images/send/send.svg';
import RecIcon from 'assets/images/send/rec.svg';
import myStyles from './TransactionDetailsStyles';

const STATUS_CONFIG = {
  SUCCESS: {label: 'Success', color: '#71C441'},
  PENDING: {label: 'Pending', color: '#ffcc00'},
  FAILED: {label: 'Failed', color: '#FF4444'},
};

const truncateAddress = address => {
  if (!address || typeof address !== 'string' || address.length <= 16) {
    return typeof address === 'string' ? address : undefined;
  }
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

const CopyRow = ({value, displayValue, styles, theme}) => {
  const stringValue = typeof value === 'string' ? value : undefined;
  return (
    <TouchableOpacity
      style={styles.rowValueRow}
      onPress={() => {
        if (stringValue) {
          Clipboard.setString(stringValue);
          showToast({type: 'success', title: 'Copied to clipboard'});
        }
      }}>
      <Text style={styles.rowValue} numberOfLines={1}>
        {displayValue || truncateAddress(stringValue)}
      </Text>
      <IoniconIcon
        name="copy-outline"
        size={16}
        color={theme.gray}
        style={styles.copyIcon}
      />
    </TouchableOpacity>
  );
};

const TransactionDetails = ({route}) => {
  const initialTransaction = route?.params?.transaction;
  const txHash = initialTransaction?.link || '';
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const reduxCurrentCoin = useSelector(selectCurrentCoin);
  const currentCoin = initialTransaction?.currentCoin || reduxCurrentCoin;
  const localCurrency = useSelector(getLocalCurrency);

  const [refreshing, setRefreshing] = useState(false);
  const [transaction, setTransaction] = useState(initialTransaction);
  const statusRef = useRef(initialTransaction?.status);

  const fetchTransaction = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await dispatch(
        refreshCurrentCoin({fetchTransaction: true, txHash}),
      ).unwrap();
      const recentTransaction = result?.updatedCurrentCoin?.recentTransaction;
      if (recentTransaction) {
        const {
          link,
          from,
          to,
          amount,
          totalCourse,
          blockTimestamp,
          status,
          blockNumber,
          confirmations,
          paymentType,
        } = recentTransaction.data;
        const date = blockTimestamp
          ? new Date(parseInt(blockTimestamp, 16) * 1000).toISOString()
          : initialTransaction.date;
        statusRef.current = status;
        setTransaction({
          ...initialTransaction,
          from,
          to,
          amount: amount,
          date,
          status: status,
          link: link,
          totalCourse,
          blockNumber: blockNumber,
          confirmations,
          ...(paymentType != null && {paymentType}),
        });
      }
    } catch (e) {
      console.error('Error refreshing transaction', e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, initialTransaction, txHash]);

  useEffect(() => {
    fetchTransaction();
    const interval = setInterval(() => {
      if (statusRef.current?.toUpperCase() === 'SUCCESS') {
        clearInterval(interval);
        return;
      }
      fetchTransaction();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isReceived =
    transaction?.paymentType != null
      ? transaction.paymentType === 1
      : transaction?.to?.toUpperCase() === currentCoin?.address?.toUpperCase();

  const statusKey = transaction?.status?.toUpperCase();
  const statusConfig = STATUS_CONFIG[statusKey] || {
    label: transaction?.status || '—',
    color: theme.gray,
  };

  const onRefresh = useCallback(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const onViewExplorer = useCallback(() => {
    if (transaction?.url) {
      InAppBrowser.open(transaction.url, inAppBrowserOptions).then();
    }
  }, [transaction?.url]);

  if (!transaction) {
    return (
      <DokSafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transaction data found.</Text>
        </View>
      </DokSafeAreaView>
    );
  }

  const iconBgColor = isReceived ? '#e8f7e0' : '#fdecea';
  const amountColor = isReceived ? '#71C441' : '#FF4444';
  const badgeBgColor = statusConfig.color + '22';

  return (
    <DokSafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconCircle, {backgroundColor: iconBgColor}]}>
            {isReceived ? (
              <RecIcon width={32} height={32} />
            ) : (
              <SendIcon width={32} height={32} />
            )}
          </View>
          <Text style={styles.txType}>{isReceived ? 'Received' : 'Sent'}</Text>
          <Text style={[styles.amount, {color: amountColor}]}>
            {isReceived ? '+' : '-'}
            {transaction.amount} {currentCoin?.symbol}
          </Text>
          {transaction.totalCourse != null && (
            <Text style={styles.fiatAmount}>
              {currencySymbol[localCurrency]}
              {transaction.totalCourse}
            </Text>
          )}
          <View style={[styles.statusBadge, {backgroundColor: badgeBgColor}]}>
            <View
              style={[styles.statusDot, {backgroundColor: statusConfig.color}]}
            />
            <Text style={[styles.statusText, {color: statusConfig.color}]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Details</Text>

          {!!transaction.date && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Date</Text>
                <Text style={styles.rowValue}>
                  {dayjs(transaction.date).format('DD MMM YYYY, HH:mm')}
                </Text>
              </View>
            </>
          )}

          {transaction.blockNumber != null && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Block no.</Text>
                <Text style={styles.rowValue}>{transaction.blockNumber}</Text>
              </View>
            </>
          )}

          {transaction.confirmations != null && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>No. of Confirmation</Text>
                <Text style={styles.rowValue}>{transaction.confirmations}</Text>
              </View>
            </>
          )}
          {!!transaction.link && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Tx Hash</Text>
              <CopyRow value={transaction.link} styles={styles} theme={theme} />
            </View>
          )}

          {!!transaction.from && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>From</Text>
                <CopyRow
                  value={transaction.from}
                  styles={styles}
                  theme={theme}
                />
              </View>
            </>
          )}

          {!!transaction.to && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>To</Text>
                <CopyRow value={transaction.to} styles={styles} theme={theme} />
              </View>
            </>
          )}

          {/* {transaction.fee != null && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Network Fee</Text>
                <Text style={styles.rowValue}>
                  {transaction.fee}{' '}
                  {currentCoin?.chain_symbol || currentCoin?.symbol}
                </Text>
              </View>
            </>
          )} */}
        </View>

        {/* Explorer button */}
        {!!transaction.url && (
          <TouchableOpacity
            style={[styles.explorerBtn, {backgroundColor: theme.background}]}
            onPress={onViewExplorer}>
            <IoniconIcon name="open-outline" size={18} color="#fff" />
            <Text style={styles.explorerBtnText}>View on Explorer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </DokSafeAreaView>
  );
};

export default TransactionDetails;