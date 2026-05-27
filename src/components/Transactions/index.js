import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import TransactionsIcon from 'assets/images/send//trans.svg';
import myStyles from './TransactionsStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import dayjs from 'dayjs';
import {
  isPendingTransactionSupportedChain,
  isTransactionListNotSupported,
} from 'dok-wallet-blockchain-networks/helper';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ModalCancelPendingTransactions from 'components/ModalCancelPendingTransaction';
import {calculateEstimateFeeForPendingTransaction} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {getPendingTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {sendPendingTransactions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {useNavigation} from '@react-navigation/native';
import Spinner from 'components/Spinner';

const STATUS_CONFIG = {
  SUCCESS: {color: '#16A34A', bg: '#F0FDF4', label: 'Success'},
  FAILED: {color: '#DC2626', bg: '#FEF2F2', label: 'Failed'},
  FAIL: {color: '#DC2626', bg: '#FEF2F2', label: 'Failed'},
  PENDING: {color: '#D97706', bg: '#FFFBEB', label: 'Pending'},
  QUEUE: {color: '#6B7280', bg: '#F3F4F6', label: 'Queue'},
};

const ICON_CONFIG = {
  stake: {name: 'trending-up', lib: 'ion', bg: '#F0FDF4', color: '#16A34A'},
  unstake: {name: 'trending-down', lib: 'ion', bg: '#FFF7ED', color: '#EA580C'},
  withdraw: {
    name: 'arrow-down-circle-outline',
    lib: 'mci',
    bg: '#F0FDFA',
    color: '#0D9488',
  },
  smartContract: {
    name: 'code-braces',
    lib: 'mci',
    bg: '#FAF5FF',
    color: '#9333EA',
  },
  nftTransfer: {
    name: 'image-outline',
    lib: 'ion',
    bg: '#FDF4FF',
    color: '#9333EA',
  },
  delegationChange: {
    name: 'shield-key-outline',
    lib: 'mci',
    bg: '#EFF6FF',
    color: '#2563EB',
  },
  batch: {name: 'layers-outline', lib: 'mci', bg: '#EEF2FF', color: '#4F46E5'},
  received: {name: 'arrow-down', lib: 'ion', bg: '#F0FDF4', color: '#16A34A'},
  sent: {name: 'arrow-up', lib: 'ion', bg: '#FEF2F2', color: '#DC2626'},
};

const TX_TITLES = {
  stake: 'Stake',
  unstake: 'Unstake',
  withdraw: 'Withdraw',
  smartContract: 'Smart Contract Call',
  nftTransfer: 'NFT Transfer',
  delegationChange: 'Delegation Change',
  batch: 'Batch Transaction',
};

const truncateAmount = amount => {
  if (!amount) {
    return '';
  }
  const num = parseFloat(amount);
  if (isNaN(num) || num === 0) {
    return '0';
  }
  const abs = Math.abs(num);
  if (abs < 0.000001) {
    return num.toExponential(2);
  }
  if (abs < 1) {
    return parseFloat(num.toFixed(6)).toString();
  }
  if (abs < 1000) {
    return parseFloat(num.toFixed(4)).toString();
  }
  return parseFloat(num.toFixed(2)).toString();
};

const TxIcon = ({config}) => {
  if (config.lib === 'mci') {
    return (
      <MaterialCommunityIcons
        name={config.name}
        size={20}
        color={config.color}
      />
    );
  }
  return <IoniconIcon name={config.name} size={20} color={config.color} />;
};

const Transactions = ({renderList, selectedAddress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const pendingTransferData = useSelector(getPendingTransferData);
  const selectedTransactionRef = useRef(null);
  const isCancelTransactionRef = useRef(null);
  const navigation = useNavigation();

  const [list, setList] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const currentCoin = useSelector(selectCurrentCoin);
  const localCurrency = useSelector(getLocalCurrency);
  const isTransactionNotSuppoted = useMemo(
    () =>
      isTransactionListNotSupported(currentCoin?.chain_name, currentCoin?.type),
    [currentCoin?.chain_name, currentCoin?.type],
  );

  useEffect(() => {
    setList(renderList);
  }, [renderList]);

  const calculatePendingTransaction = useCallback(
    tx => {
      setShowCancelModal(true);
      dispatch(
        calculateEstimateFeeForPendingTransaction({
          fromAddress: tx?.extraPendingTransactionData?.from,
          toAddress: tx?.extraPendingTransactionData?.to,
          value: tx?.extraPendingTransactionData?.value,
          data: tx?.extraPendingTransactionData?.data,
          nonce: tx?.extraPendingTransactionData?.nonce,
          isCancelTransaction: true,
        }),
      );
      selectedTransactionRef.current = tx;
    },
    [dispatch],
  );

  const onPressSpeedUp = useCallback(
    tx => {
      calculatePendingTransaction(tx);
      isCancelTransactionRef.current = false;
    },
    [calculatePendingTransaction],
  );

  const onPressCancel = useCallback(
    tx => {
      calculatePendingTransaction(tx);
      isCancelTransactionRef.current = true;
    },
    [calculatePendingTransaction],
  );

  const onPressYes = useCallback(() => {
    setShowCancelModal(false);
    const tx = selectedTransactionRef.current;
    dispatch(
      sendPendingTransactions({
        from: tx?.extraPendingTransactionData?.from,
        to: tx?.extraPendingTransactionData?.to,
        value: tx?.extraPendingTransactionData?.value,
        data: tx?.extraPendingTransactionData?.data,
        nonce: tx?.extraPendingTransactionData?.nonce,
        pendingTxHash: tx?.extraPendingTransactionData?.txHash,
        isCancelTransaction: isCancelTransactionRef.current,
        navigation: navigation,
      }),
    );
  }, [dispatch, navigation]);

  const handleOnPress = useCallback(
    async item => {
      navigation.navigate('TransactionDetails', {transaction: item});
    },
    [navigation],
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {list?.length === 0 ? (
          <View style={styles.emptySection}>
            <TransactionsIcon height="114" width="114" />
            <Text style={styles.info}>
              {isTransactionNotSuppoted
                ? 'To view the latest transactions, simply click on the "View All" button'
                : 'Your transactions will be shown here. Make a payment by using wallet address or scan a QR Code'}
            </Text>
          </View>
        ) : (
          list?.map((item, index) => {
            const txType = item?.transactionType;
            const isReceived =
              txType === 'unstake' || txType === 'withdraw'
                ? true
                : txType === 'stake'
                ? false
                : item?.to?.toUpperCase() === selectedAddress?.toUpperCase();

            const iconCfg =
              ICON_CONFIG[txType] ||
              (isReceived ? ICON_CONFIG.received : ICON_CONFIG.sent);
            const title =
              TX_TITLES[txType] || (isReceived ? 'Received' : 'Sent');
            const showAmount =
              txType !== 'smartContract' &&
              txType !== 'batch' &&
              txType !== 'nftTransfer' &&
              txType !== 'delegationChange';

            const statusKey = item.status?.toUpperCase();
            const statusCfg = STATUS_CONFIG[statusKey] || {
              color: '#6B7280',
              bg: '#F3F4F6',
              label: item.status || '—',
            };
            const amountColor = isReceived ? '#16A34A' : '#DC2626';
            const formattedAmount = truncateAmount(item.amount);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleOnPress(item)}
                key={index}>
                <View style={styles.cardInner}>
                  <View
                    style={[styles.iconCircle, {backgroundColor: iconCfg.bg}]}>
                    <TxIcon config={iconCfg} />
                  </View>

                  <View style={styles.content}>
                    <Text style={styles.titleText} numberOfLines={1}>
                      {title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.dateText}>
                        {dayjs(item.date).format('DD MMM YYYY')}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          {backgroundColor: statusCfg.bg},
                        ]}>
                        <Text
                          style={[
                            styles.statusPillText,
                            {color: statusCfg.color},
                          ]}>
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.amountBox}>
                    {showAmount ? (
                      <>
                        {!!formattedAmount && (
                          <Text
                            style={[styles.amountText, {color: amountColor}]}
                            numberOfLines={1}>
                            {isReceived ? '+' : '-'}
                            {formattedAmount} {currentCoin?.symbol}
                          </Text>
                        )}
                        <Text style={styles.fiatText}>
                          {currencySymbol[localCurrency]}
                          {item.totalCourse}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.dashText}>{'—'}</Text>
                    )}
                  </View>

                  <IoniconIcon
                    name="chevron-forward"
                    size={14}
                    color={theme.gray}
                  />
                </View>

                {item.status === 'PENDING' &&
                  isPendingTransactionSupportedChain(
                    currentCoin.chain_name,
                  ) && (
                    <View style={styles.rowView}>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => onPressSpeedUp(item)}>
                        <IoniconIcon
                          name="trending-up"
                          size={18}
                          color="white"
                        />
                        <Text style={styles.buttonTitle}>Speed Up</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => onPressCancel(item)}>
                        <IoniconIcon name="close" size={18} color="white" />
                        <Text style={styles.buttonTitle}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      {pendingTransferData.isSubmitting && <Spinner />}
      <ModalCancelPendingTransactions
        visible={showCancelModal}
        onPressYes={onPressYes}
        onPressNo={() => setShowCancelModal(false)}
        pendingTransferData={pendingTransferData}
        currentCoin={currentCoin}
        localCurrency={localCurrency}
        isCancelTransaction={isCancelTransactionRef.current}
      />
    </>
  );
};

export default Transactions;
