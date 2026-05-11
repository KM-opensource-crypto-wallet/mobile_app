import {ThemeContext} from 'theme/ThemeContext';
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
import {
  selectCurrentCoin,
  selectCurrentCoinRecentTransaction,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {fetchTransactionByHash} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {currencySymbol} from 'data/currency';
import Clipboard from '@react-native-clipboard/clipboard';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';
import {showToast} from 'utils/toast';
import dayjs from 'dayjs';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from '@d11/react-native-fast-image';
import DefaultDokWalletImage from 'components/DefaultDokWalletImage';
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

const TransactionDetails = ({route, navigation}) => {
  const initialTransaction = route?.params?.transaction;
  const txHash = initialTransaction?.link || '';
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const reduxCurrentCoin = useSelector(selectCurrentCoin);
  const currentCoin = initialTransaction?.currentCoin || reduxCurrentCoin;
  const localCurrency = useSelector(getLocalCurrency);
  const reduxRecentTransaction = useSelector(
    selectCurrentCoinRecentTransaction,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [nftImageError, setNftImageError] = useState(false);
  const statusRef = useRef(initialTransaction?.status);

  useLayoutEffect(() => {
    const title = initialTransaction?.isNFT
      ? 'NFT Transfer'
      : `${currentCoin?.name || ''} Transaction`;
    navigation.setOptions({title});
  }, [navigation, currentCoin?.name, initialTransaction?.isNFT]);

  const recentTx =
    reduxRecentTransaction?.data?.link === txHash
      ? reduxRecentTransaction?.data
      : null;
  const transaction = recentTx
    ? {
        ...initialTransaction,
        from: recentTx.from,
        to: recentTx.to,
        amount: recentTx.amount,
        date: recentTx.blockTimestamp
          ? new Date(parseInt(recentTx.blockTimestamp, 16) * 1000).toISOString()
          : initialTransaction.date,
        status: recentTx.status,
        link: recentTx.link,
        totalCourse: recentTx.totalCourse,
        blockNumber: recentTx.blockNumber,
        confirmations: recentTx.confirmations,
        ...(recentTx.paymentType != null && {
          paymentType: recentTx.paymentType,
        }),
      }
    : initialTransaction;

  useEffect(() => {
    if (recentTx?.status) {
      statusRef.current = recentTx.status;
    }
  }, [recentTx?.status]);

  const currentCoinRef = useRef(currentCoin);

  const fetchTransaction = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(
        fetchTransactionByHash({
          txHash,
          currentCoin: currentCoinRef.current,
        }),
      ).unwrap();
    } catch (e) {
      console.error('Error refreshing transaction', e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, txHash]);

  useEffect(() => {
    fetchTransaction();
    const interval = setInterval(() => {
      const upperStatus = statusRef.current?.toUpperCase();
      if (upperStatus === 'SUCCESS' || upperStatus === 'FAILED') {
        clearInterval(interval);
        return;
      }
      fetchTransaction();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Transaction type detection ──────────────────────────────────────────────

  const isNFT = !!transaction?.isNFT;
  const isBatchTx = !!transaction?.isBatchTransaction;
  const isStakingTx = !!(
    transaction?.isCreateStaking ||
    transaction?.isWithdrawStaking ||
    transaction?.isDeactivateStaking ||
    transaction?.isStakingRewards ||
    transaction?.transactionType === 'stake' ||
    transaction?.transactionType === 'unstake' ||
    transaction?.transactionType === 'withdraw'
  );
  const isVoteTx = !!transaction?.isCreateVote;
  const isRegularTx = !isNFT && !isBatchTx && !isStakingTx && !isVoteTx;

  const stakingLabel =
    transaction?.isCreateStaking || transaction?.transactionType === 'stake'
      ? 'Staking'
      : transaction?.isWithdrawStaking ||
        transaction?.transactionType === 'withdraw'
      ? 'Withdraw'
      : transaction?.isDeactivateStaking ||
        transaction?.transactionType === 'unstake'
      ? 'Unstaking'
      : 'Claimed Rewards';

  // ── Regular tx helpers ──────────────────────────────────────────────────────

  const isReceived = isRegularTx
    ? transaction?.paymentType != null
      ? transaction.paymentType === 1
      : transaction?.to?.toUpperCase() === currentCoin?.address?.toUpperCase()
    : false;

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

  const badgeBgColor = statusConfig.color + '22';

  // ── Status badge (shared) ───────────────────────────────────────────────────

  const StatusBadge = () => (
    <View style={[styles.statusBadge, {backgroundColor: badgeBgColor}]}>
      <View style={[styles.statusDot, {backgroundColor: statusConfig.color}]} />
      <Text style={[styles.statusText, {color: statusConfig.color}]}>
        {statusConfig.label}
      </Text>
    </View>
  );

  // ── Common card rows (Date, Block, Confirmations, Tx Hash) ──────────────────

  const renderCommonRows = () => (
    <>
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
        <>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tx Hash</Text>
            <CopyRow value={transaction.link} styles={styles} theme={theme} />
          </View>
        </>
      )}
    </>
  );

  // ── NFT ─────────────────────────────────────────────────────────────────────

  if (isNFT) {
    const nftLabel = transaction.nftTokenId
      ? `${transaction.nftName || '—'} (#${transaction.nftTokenId})`
      : transaction.nftName || '—';

    return (
      <DokSafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.hero}>
            {transaction.nftImage && !nftImageError ? (
              <FastImage
                source={{uri: transaction.nftImage}}
                style={styles.nftHeroImage}
                resizeMode="cover"
                onError={() => setNftImageError(true)}
              />
            ) : (
              <View style={styles.nftHeroImage}>
                <DefaultDokWalletImage height={80} width={80} />
              </View>
            )}
            <Text style={styles.txType}>NFT Transfer</Text>
            <Text style={styles.amount}>{nftLabel}</Text>
            <StatusBadge />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            {!!currentCoin?.chain_display_name && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Chain</Text>
                  <Text style={styles.rowValue}>
                    {currentCoin.chain_display_name}
                  </Text>
                </View>
              </>
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
                  <CopyRow
                    value={transaction.to}
                    styles={styles}
                    theme={theme}
                  />
                </View>
              </>
            )}
            {renderCommonRows()}
          </View>

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
  }

  // ── Batch Transaction ────────────────────────────────────────────────────────

  if (isBatchTx) {
    const batchItems = Array.isArray(transaction.transactionsData)
      ? transaction.transactionsData
      : [];

    return (
      <DokSafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.hero}>
            <View style={[styles.iconCircle, {backgroundColor: '#e8eaf6'}]}>
              <MaterialCommunityIcons
                name="layers-outline"
                size={32}
                color="#5c6bc0"
              />
            </View>
            <Text style={styles.txType}>Batch Transaction</Text>
            <Text style={styles.heroSubLabel}>
              {batchItems.length} transaction
              {batchItems.length !== 1 ? 's' : ''}
            </Text>
            <StatusBadge />
          </View>

          {batchItems.length > 0 && (
            <View style={styles.batchCard}>
              <Text style={styles.cardTitle}>Transactions</Text>
              {batchItems.map((item, index) => {
                const coinInfo = item?.coinInfo;
                const tData = item?.transferData;
                return (
                  <React.Fragment key={`batch_item_${index}`}>
                    <View style={styles.divider} />
                    <View style={styles.batchItem}>
                      <View style={styles.batchItemRow}>
                        <Text style={styles.batchItemCoin}>
                          {coinInfo?.name
                            ? `${coinInfo.name} (${coinInfo.symbol})`
                            : coinInfo?.symbol || '—'}
                        </Text>
                        <Text style={styles.batchItemAmount}>
                          {tData?.amount || '0'} {coinInfo?.symbol || ''}
                        </Text>
                      </View>
                      {!!tData?.to && (
                        <Text style={styles.batchItemTo} numberOfLines={1}>
                          To: {truncateAddress(tData.to)}
                        </Text>
                      )}
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            {renderCommonRows()}
          </View>

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
  }

  // ── Staking ──────────────────────────────────────────────────────────────────

  if (isStakingTx) {
    const isPositive =
      transaction?.isCreateStaking || transaction?.isStakingRewards;
    const stakingIconBg = isPositive ? '#e8f7e0' : '#fff3e0';
    const stakingIconColor = isPositive ? '#71C441' : '#FF9800';
    const stakingIconName = transaction?.isCreateStaking
      ? 'trending-up'
      : transaction?.isWithdrawStaking
      ? 'trending-down'
      : transaction?.isDeactivateStaking
      ? 'power'
      : 'star-circle';
    const amountColor = isPositive ? '#71C441' : '#FF9800';

    return (
      <DokSafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.hero}>
            <View style={[styles.iconCircle, {backgroundColor: stakingIconBg}]}>
              <MaterialCommunityIcons
                name={stakingIconName}
                size={32}
                color={stakingIconColor}
              />
            </View>
            <Text style={styles.txType}>{stakingLabel}</Text>
            {!!transaction.amount && (
              <Text style={[styles.amount, {color: amountColor}]}>
                {transaction.amount} {currentCoin?.symbol}
              </Text>
            )}
            {transaction.totalCourse != null && (
              <Text style={styles.fiatAmount}>
                {currencySymbol[localCurrency]}
                {transaction.totalCourse}
              </Text>
            )}
            <StatusBadge />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            {!!currentCoin?.chain_display_name && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Chain</Text>
                  <Text style={styles.rowValue}>
                    {currentCoin.chain_display_name}
                  </Text>
                </View>
              </>
            )}
            {!!currentCoin?.name && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Asset</Text>
                  <Text style={styles.rowValue}>
                    {currentCoin.name} ({currentCoin.symbol})
                  </Text>
                </View>
              </>
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
            {!!transaction.validatorPubKey && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Validator Address</Text>
                  <CopyRow
                    value={transaction.validatorPubKey}
                    styles={styles}
                    theme={theme}
                  />
                </View>
              </>
            )}
            {!!transaction.validatorName && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Validator Name</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {transaction.validatorName}
                  </Text>
                </View>
              </>
            )}
            {!!transaction.resourceType && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Resource Type</Text>
                  <Text style={styles.rowValue}>
                    {transaction.resourceType}
                  </Text>
                </View>
              </>
            )}
            {renderCommonRows()}
          </View>

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
  }

  // ── Vote Staking ─────────────────────────────────────────────────────────────

  if (isVoteTx) {
    const displayValidators = Array.isArray(transaction.displayValidators)
      ? transaction.displayValidators
      : [];

    return (
      <DokSafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.hero}>
            <View style={[styles.iconCircle, {backgroundColor: '#e3f2fd'}]}>
              <MaterialCommunityIcons name="vote" size={32} color="#1976D2" />
            </View>
            <Text style={styles.txType}>Votes Submitted</Text>
            {displayValidators.length > 0 && (
              <Text style={styles.heroSubLabel}>
                {displayValidators.length} validator
                {displayValidators.length !== 1 ? 's' : ''}
              </Text>
            )}
            <StatusBadge />
          </View>

          {displayValidators.length > 0 && (
            <View style={styles.batchCard}>
              <Text style={styles.cardTitle}>Validators</Text>
              {displayValidators.map((item, index) => (
                <React.Fragment key={`validator_${index}`}>
                  <View style={styles.divider} />
                  <View style={styles.validatorItem}>
                    <View style={styles.validatorItemRow}>
                      <Text style={styles.validatorItemName} numberOfLines={1}>
                        {item?.name || truncateAddress(item?.validatorAddress)}
                      </Text>
                      <Text style={styles.validatorItemVotes}>
                        {item?.votes} votes
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
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
            {renderCommonRows()}
          </View>

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
  }

  // ── Regular (Send / Receive) ─────────────────────────────────────────────────

  const iconBgColor = isReceived ? '#e8f7e0' : '#fdecea';
  const amountColor = isReceived ? '#71C441' : '#FF4444';

  return (
    <DokSafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
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
          <StatusBadge />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Details</Text>
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
          {renderCommonRows()}
        </View>

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
