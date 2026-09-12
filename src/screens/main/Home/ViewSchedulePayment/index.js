import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import myStyles from './ViewSchedulePaymentStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import ScheduledPaymentItem from 'components/ScheduledPaymentItem';
import {
  selectCoinsForCurrentWallet,
  selectCurrentCoin,
  selectCurrentWalletClientId,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {selectActiveScheduledPaymentsForCurrentWallet} from 'dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSelectors';
import {
  pruneExpiredScheduledPayments,
  removeScheduledPayment,
  syncScheduledPaymentNotifications,
} from 'dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSlice';
import {useLocalNotification} from 'providers/hooks/useLocalNotification';
import {SCHEDULED_PAYMENT_NOTIFICATION_TYPE} from 'utils/scheduledPaymentNotifications';
import {countTriggersByPayment} from 'utils/scheduledPaymentTriggerPlan';
import {
  buildCoinMapForScheduledPayments,
  getAssetKeyForCoin,
  getAssetKeyForPayment,
} from 'utils/scheduledPaymentCoin';
import {getNextOccurrence} from 'utils/scheduleRecurrence';

const PAYMENT_FILTER = {
  CURRENT_TOKEN: 'currentToken',
  ALL: 'all',
};

const ViewSchedulePayment = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const {handleScheduledPaymentNotificationData, pendingScheduledPaymentData} =
    useLocalNotification();
  const scheduledPayments = useSelector(
    selectActiveScheduledPaymentsForCurrentWallet,
  );
  const walletCoins = useSelector(selectCoinsForCurrentWallet);
  const currentCoin = useSelector(selectCurrentCoin);
  const walletClientId = useSelector(selectCurrentWalletClientId);
  const localCurrency = useSelector(getLocalCurrency);
  // A reminder handler that couldn't resolve the payment's coin lands here
  // with showAll, since the current-token filter would hide that payment.
  const [paymentFilter, setPaymentFilter] = useState(
    route?.params?.showAll ? PAYMENT_FILTER.ALL : PAYMENT_FILTER.CURRENT_TOKEN,
  );

  // Expired payments (one-time past due, or a repeating series that ran
  // out) are deleted for good whenever the list is shown — except one whose
  // reminder was just tapped and is still waiting to be handled. Then the
  // OS's pending reminders are brought back in line with redux.
  const pendingScheduledPaymentId =
    pendingScheduledPaymentData?.scheduledPaymentId;
  useFocusEffect(
    useCallback(() => {
      dispatch(
        pruneExpiredScheduledPayments({keepIds: [pendingScheduledPaymentId]}),
      ).then(() => dispatch(syncScheduledPaymentNotifications()));
    }, [dispatch, pendingScheduledPaymentId]),
  );

  const coinMap = useMemo(
    () => buildCoinMapForScheduledPayments(walletCoins),
    [walletCoins],
  );

  // Pending-notification slots: per payment for the cards, and app-wide
  // (every wallet, same set the create-time limit check counts) for the
  const slotsByPayment = useMemo(
    () => countTriggersByPayment(scheduledPayments),
    [scheduledPayments],
  );

  const isCurrentTokenFilter = paymentFilter === PAYMENT_FILTER.CURRENT_TOKEN;

  // Soonest upcoming occurrence first.
  const sortedPayments = useMemo(() => {
    const currentKey = currentCoin ? getAssetKeyForCoin(currentCoin) : null;
    return scheduledPayments
      .filter(
        item =>
          !isCurrentTokenFilter ||
          (!!currentKey && getAssetKeyForPayment(item) === currentKey),
      )
      .map(item => ({item, next: getNextOccurrence(item)?.timestamp || 0}))
      .sort((a, b) => a.next - b.next)
      .map(entry => entry.item);
  }, [scheduledPayments, isCurrentTokenFilter, currentCoin]);

  const handleAdd = useCallback(
    () => navigation.navigate('SchedulePayment'),
    [navigation],
  );

  useLayoutEffect(() => {
    navigation?.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddBtn}
          activeOpacity={0.7}
          onPress={handleAdd}>
          <IoniconIcon name="add" size={16} color={theme.background} />
          <Text style={styles.headerAddBtnText}>{'Add'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    handleAdd,
    styles.headerAddBtn,
    styles.headerAddBtnText,
    theme.background,
  ]);

  const handleRemove = useCallback(
    item => {
      dispatch(removeScheduledPayment({id: item?.id, walletClientId}));
      dispatch(syncScheduledPaymentNotifications());
      Toast.show({
        type: 'successToast',
        text1: 'Scheduled payment removed',
      });
    },
    [dispatch, walletClientId],
  );

  // The edit form gets the payment as stored: its scheduledAt is the
  // series' original start (possibly past), which the form accepts
  // unchanged so saving never shifts the series.
  const handleEdit = useCallback(
    item => {
      navigation.navigate('SchedulePayment', {scheduledPayment: item});
    },
    [navigation],
  );

  // Same path a reminder tap takes: switch to the coin, refresh it and land
  // on Transfer prefilled with this payment.
  const handleSendNow = useCallback(
    item => {
      handleScheduledPaymentNotificationData({
        type: SCHEDULED_PAYMENT_NOTIFICATION_TYPE,
        scheduledPaymentId: item?.id,
        walletClientId,
      });
    },
    [handleScheduledPaymentNotificationData, walletClientId],
  );

  const renderItem = useCallback(
    ({item}) => (
      <ScheduledPaymentItem
        item={item}
        coin={coinMap.get(getAssetKeyForPayment(item))}
        localCurrency={localCurrency}
        reminderSlots={slotsByPayment.get(item?.id) ?? 0}
        onEdit={handleEdit}
        onRemove={handleRemove}
        onSendNow={handleSendNow}
      />
    ),
    [
      coinMap,
      localCurrency,
      slotsByPayment,
      handleEdit,
      handleRemove,
      handleSendNow,
    ],
  );

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            isCurrentTokenFilter && styles.filterPillSelected,
          ]}
          onPress={() => setPaymentFilter(PAYMENT_FILTER.CURRENT_TOKEN)}>
          <Text
            style={[
              styles.filterPillText,
              isCurrentTokenFilter && styles.filterPillTextSelected,
            ]}>
            {currentCoin?.symbol
              ? `Current Token (${currentCoin.symbol})`
              : 'Current Token'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.filterPill,
            !isCurrentTokenFilter && styles.filterPillSelected,
          ]}
          onPress={() => setPaymentFilter(PAYMENT_FILTER.ALL)}>
          <Text
            style={[
              styles.filterPillText,
              !isCurrentTokenFilter && styles.filterPillTextSelected,
            ]}>
            {'All Scheduled'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={sortedPayments}
        keyExtractor={item => item?.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <IoniconIcon
                name="calendar-outline"
                size={28}
                color={theme.gray}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {isCurrentTokenFilter
                ? `No scheduled payments for ${
                    currentCoin?.symbol || 'this token'
                  }`
                : 'No scheduled payments yet'}
            </Text>
            <Text style={styles.emptyText}>
              {isCurrentTokenFilter
                ? 'Schedule a payment for this token, or switch to "All Scheduled" to see payments for other tokens.'
                : "Schedule a payment and we'll remind you when it's time to send it."}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              activeOpacity={0.7}
              onPress={handleAdd}>
              <IoniconIcon name="add" size={18} color={theme.title} />
              <Text style={styles.emptyAddButtonText}>
                {'Schedule a payment'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </DokSafeAreaView>
  );
};

export default ViewSchedulePayment;
