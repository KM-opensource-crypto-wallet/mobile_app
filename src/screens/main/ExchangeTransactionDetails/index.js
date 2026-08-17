import React, {useCallback, useContext, useEffect} from 'react';
import {View, Text, ScrollView, RefreshControl} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import Loading from 'components/Loading';
import EmptyView from 'components/EmptyView';
import ExchangeStatusBadge from 'components/ExchangeHistory/ExchangeStatusBadge';
import ExchangeDetailRow from 'components/ExchangeHistory/ExchangeDetailRow';
import SwapCoinIcon from 'components/ExchangeHistory/SwapCoinIcon';
import useSwapCoinDisplay from 'components/ExchangeHistory/useSwapCoinDisplay';
import {
  truncateExchangeAmount,
  TERMINAL_EXCHANGE_STATUSES,
} from 'components/ExchangeHistory/exchangeFormat';
import {
  fetchExchangeTransactionDetails,
  clearCurrentExchangeTransaction,
} from 'dok-wallet-blockchain-networks/redux/exchangeHistory/exchangeHistorySlice';
import {
  selectCurrentExchangeTransaction,
  selectExchangeDetailLoading,
  selectExchangeDetailRefreshing,
  selectExchangeDetailError,
} from 'dok-wallet-blockchain-networks/redux/exchangeHistory/exchangeHistorySelectors';
import {
  getCustomizePublicAddress,
  getExplorerTxUrl,
} from 'dok-wallet-blockchain-networks/helper';
import {openInAppBrowser} from 'utils/inAppBrowser';
import {inAppBrowserOptions} from 'utils/common';
import myStyles from './ExchangeTransactionDetailsStyles';

const POLL_INTERVAL_MS = 30_000;

// Details of one swap. Polls every 30s while the status is non-terminal —
// the backend refreshes the transaction from its provider on each fetch.
const ExchangeTransactionDetails = ({route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  const transactionId = route?.params?.transactionId;
  const transaction = useSelector(selectCurrentExchangeTransaction);
  const loading = useSelector(selectExchangeDetailLoading);
  const refreshing = useSelector(selectExchangeDetailRefreshing);
  const error = useSelector(selectExchangeDetailError);

  const isTerminal = TERMINAL_EXCHANGE_STATUSES.includes(transaction?.status);
  const {from: fromDisplay, to: toDisplay} = useSwapCoinDisplay(transaction);

  useEffect(() => {
    if (transactionId) {
      dispatch(fetchExchangeTransactionDetails({id: transactionId}));
    }
    return () => {
      dispatch(clearCurrentExchangeTransaction());
    };
  }, [dispatch, transactionId]);

  useEffect(() => {
    if (!transactionId || isTerminal) {
      return;
    }
    const interval = setInterval(() => {
      dispatch(fetchExchangeTransactionDetails({id: transactionId}));
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch, transactionId, isTerminal]);

  const onRefresh = useCallback(() => {
    if (transactionId) {
      dispatch(
        fetchExchangeTransactionDetails({id: transactionId, refresh: true}),
      );
    }
  }, [dispatch, transactionId]);

  const openExplorer = useCallback((chainName, hash) => {
    const url = getExplorerTxUrl(chainName, hash);
    if (url) {
      openInAppBrowser(url, inAppBrowserOptions).then();
    }
  }, []);

  if (loading && !transaction) {
    return <Loading />;
  }

  if (!transaction) {
    return (
      <DokSafeAreaView style={styles.container}>
        <EmptyView text={error || 'Exchange transaction not found.'} />
      </DokSafeAreaView>
    );
  }

  const metadata = transaction.metadata || {};
  const fromAmount = truncateExchangeAmount(transaction.from_amount);
  const toAmount = truncateExchangeAmount(transaction.to_amount);
  const fromSymbol = transaction.from_currency?.toUpperCase() || '';
  const toSymbol = transaction.to_currency?.toUpperCase() || '';
  const providerName = metadata.providerTitle || transaction.provider;
  const dateLabel = transaction.created_at
    ? dayjs(transaction.created_at).format('DD MMM YYYY, hh:mm A')
    : null;
  const fromExplorerUrl =
    metadata.fromChainName && transaction.from_tx_hash
      ? getExplorerTxUrl(metadata.fromChainName, transaction.from_tx_hash)
      : null;
  const toExplorerUrl =
    metadata.toChainName && transaction.to_tx_hash
      ? getExplorerTxUrl(metadata.toChainName, transaction.to_tx_hash)
      : null;
  const hasAny = (...values) =>
    values.some(value => value !== null && value !== undefined && value !== '');

  return (
    <DokSafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.background}
          />
        }>
        <View style={styles.swapCard}>
          <View style={styles.swapCardHeader}>
            <View style={styles.logoCircle}>
              {metadata.providerSrc ? (
                <FastImage
                  source={{uri: metadata.providerSrc}}
                  resizeMode={'contain'}
                  style={styles.logo}
                />
              ) : (
                <IoniconIcon
                  name="swap-horizontal"
                  size={26}
                  color={theme.background}
                />
              )}
            </View>
            <ExchangeStatusBadge status={transaction.status} />
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>You sent</Text>
            <View style={styles.amountRow}>
              <SwapCoinIcon
                icon={fromDisplay.icon}
                symbol={fromSymbol}
                chainName={fromDisplay.chainName}
                size={38}
              />
              <View style={styles.amountTextBox}>
                <Text style={styles.amountValue} numberOfLines={1}>
                  {fromAmount
                    ? `${fromAmount} ${fromSymbol}`
                    : `— ${fromSymbol}`}
                </Text>
                {!!fromDisplay.chainDisplayName && (
                  <Text style={styles.chainNameText} numberOfLines={1}>
                    {`on ${fromDisplay.chainDisplayName}`}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.arrowDivider}>
            <View style={styles.dividerLine} />
            <View style={styles.arrowChip}>
              <IoniconIcon
                name="arrow-down"
                size={16}
                color={theme.background}
              />
            </View>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>
              {transaction.status === 'completed'
                ? 'You received'
                : 'You receive'}
            </Text>
            <View style={styles.amountRow}>
              <SwapCoinIcon
                icon={toDisplay.icon}
                symbol={toSymbol}
                chainName={toDisplay.chainName}
                size={38}
              />
              <View style={styles.amountTextBox}>
                <Text style={styles.amountValue} numberOfLines={1}>
                  {toAmount ? `${toAmount} ${toSymbol}` : `— ${toSymbol}`}
                </Text>
                {!!toDisplay.chainDisplayName && (
                  <Text style={styles.chainNameText} numberOfLines={1}>
                    {`on ${toDisplay.chainDisplayName}`}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.metaFooter}>
            {`via ${providerName}${dateLabel ? ` · ${dateLabel}` : ''}`}
          </Text>
          {transaction.status === 'pending' && (
            <View style={styles.pendingHintRow}>
              <IoniconIcon name="sync-outline" size={13} color={theme.gray} />
              <Text style={styles.pendingHint}>
                Status updates automatically every 30 seconds.
              </Text>
            </View>
          )}
        </View>

        {hasAny(providerName, dateLabel, transaction.provider_tx_id) && (
          <>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.sectionCard}>
              <ExchangeDetailRow
                isFirst
                icon="swap-horizontal-outline"
                label="Provider"
                value={providerName}
              />
              <ExchangeDetailRow
                icon="calendar-outline"
                label="Date"
                value={dateLabel}
              />
              <ExchangeDetailRow
                icon="receipt-outline"
                label="Order id"
                value={transaction.provider_tx_id}
                copyable
              />
            </View>
          </>
        )}

        {hasAny(
          metadata.depositAddress,
          transaction.from_memo,
          transaction.to_address,
          transaction.from_address,
        ) && (
          <>
            <Text style={styles.sectionTitle}>Addresses</Text>
            <View style={styles.sectionCard}>
              {/* from_address is the sending wallet — the app sets the swap's
                  refundAddress to it, so it doubles as the refund address. */}
              <ExchangeDetailRow
                isFirst
                icon="send-outline"
                label="Sender address"
                value={transaction.from_address}
                copyable
              />
              <ExchangeDetailRow
                icon="wallet-outline"
                label="Deposit address"
                value={metadata.depositAddress}
                copyable
              />
              <ExchangeDetailRow
                icon="document-text-outline"
                label="Memo"
                value={transaction.from_memo}
                copyable
              />
              <ExchangeDetailRow
                icon="person-outline"
                label="Recipient"
                value={transaction.to_address}
                copyable
              />
            </View>
          </>
        )}

        {hasAny(transaction.from_tx_hash, transaction.to_tx_hash) && (
          <>
            <Text style={styles.sectionTitle}>On-chain</Text>
            <View style={styles.sectionCard}>
              <ExchangeDetailRow
                isFirst
                icon="arrow-up-circle-outline"
                label="Deposit tx"
                value={transaction.from_tx_hash}
                displayValue={getCustomizePublicAddress(
                  transaction.from_tx_hash,
                )}
                onPress={
                  fromExplorerUrl
                    ? () =>
                        openExplorer(
                          metadata.fromChainName,
                          transaction.from_tx_hash,
                        )
                    : undefined
                }
                copyable
              />
              <ExchangeDetailRow
                icon="arrow-down-circle-outline"
                label="Receive tx"
                value={transaction.to_tx_hash}
                displayValue={getCustomizePublicAddress(transaction.to_tx_hash)}
                onPress={
                  toExplorerUrl
                    ? () =>
                        openExplorer(
                          metadata.toChainName,
                          transaction.to_tx_hash,
                        )
                    : undefined
                }
                copyable
              />
            </View>
          </>
        )}
      </ScrollView>
    </DokSafeAreaView>
  );
};

export default ExchangeTransactionDetails;
