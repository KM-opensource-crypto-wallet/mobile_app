import React, {useCallback, useContext, useLayoutEffect, useMemo} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import myStyles from './ViewSchedulePaymentStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {selectScheduledPaymentsForCurrentWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {removeScheduledPayment} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {useLocalNotification} from 'providers/hooks/useLocalNotification';
import {describeRecurrence} from 'utils/scheduleRecurrence';
import {truncateAddress} from 'utils/common';

dayjs.extend(relativeTime);

const STATUS_META = {
  scheduled: {label: 'Scheduled', color: '#4F8DD8', icon: 'time-outline'},
  sent: {label: 'Sent', color: '#1FA971', icon: 'checkmark-circle-outline'},
  completed: {
    label: 'Sent',
    color: '#1FA971',
    icon: 'checkmark-circle-outline',
  },
  failed: {label: 'Failed', color: '#E5484D', icon: 'alert-circle-outline'},
  cancelled: {
    label: 'Cancelled',
    color: '#8A8886',
    icon: 'close-circle-outline',
  },
};

const getStatusMeta = status => STATUS_META[status] || STATUS_META.scheduled;

const getInitial = symbol =>
  symbol ? symbol.trim().charAt(0).toUpperCase() : '?';

const ViewSchedulePayment = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const {cancelScheduledPaymentNotification} = useLocalNotification();
  const scheduledPayments = useSelector(
    selectScheduledPaymentsForCurrentWallet,
  );

  // Soonest upcoming payment first; anything whose time has already passed
  // sinks below the upcoming ones, most recently missed first.
  const sortedPayments = useMemo(() => {
    const list = Array.isArray(scheduledPayments) ? scheduledPayments : [];
    const now = Date.now();
    const upcoming = list
      .filter(item => !item?.scheduledAt || item.scheduledAt >= now)
      .sort((a, b) => (a?.scheduledAt || 0) - (b?.scheduledAt || 0));
    const past = list
      .filter(item => item?.scheduledAt && item.scheduledAt < now)
      .sort((a, b) => (b?.scheduledAt || 0) - (a?.scheduledAt || 0));
    return [...upcoming, ...past];
  }, [scheduledPayments]);

  useLayoutEffect(() => {
    navigation?.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SchedulePayment')}>
          <IoniconIcon name="add" size={16} color={theme.background} />
          <Text style={styles.headerAddBtnText}>{'Add'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    styles.headerAddBtn,
    styles.headerAddBtnText,
    theme.background,
  ]);

  const handleDelete = useCallback(
    id => {
      dispatch(removeScheduledPayment({id}));
      cancelScheduledPaymentNotification(id);
      Toast.show({
        type: 'successToast',
        text1: 'Scheduled payment removed',
      });
    },
    [dispatch, cancelScheduledPaymentNotification],
  );

  const handleEdit = useCallback(
    item => {
      navigation.navigate('SchedulePayment', {scheduledPayment: item});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}) => {
      const isPastDue =
        item?.status === 'scheduled' &&
        item?.scheduledAt &&
        item.scheduledAt < Date.now();
      const statusMeta = isPastDue
        ? {label: 'Processed', color: '#8A8886', icon: 'time-outline'}
        : getStatusMeta(item?.status);
      const scheduledDate = item?.scheduledAt ? dayjs(item.scheduledAt) : null;
      const recurrenceLabel = describeRecurrence(item?.recurrence);
      return (
        <View style={[styles.card, isPastDue && styles.cardPastDue]}>
          <View style={styles.cardTopRow}>
            <View style={styles.avatarAndAmount}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitial(item?.asset?.symbol)}
                </Text>
              </View>
              <View>
                <Text style={styles.amountText}>
                  {`${item?.amount || ''} ${item?.asset?.symbol || ''}`}
                </Text>
                <Text style={styles.amountSubtitle}>{'Scheduled payment'}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusMeta.color + '18'},
              ]}>
              <IoniconIcon
                name={statusMeta.icon}
                size={12}
                color={statusMeta.color}
              />
              <Text style={[styles.statusBadgeText, {color: statusMeta.color}]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <IoniconIcon name="person-outline" size={14} color={theme.gray} />
            <Text style={styles.detailText} numberOfLines={1}>
              {truncateAddress(item?.recipientAddress)}
            </Text>
          </View>

          {!!scheduledDate && (
            <View style={styles.detailRow}>
              <IoniconIcon
                name="calendar-outline"
                size={14}
                color={theme.gray}
              />
              <Text style={styles.detailText} numberOfLines={1}>
                {`${scheduledDate.format(
                  'MMM D, YYYY · h:mm A',
                )}  ·  ${scheduledDate.fromNow()}`}
              </Text>
            </View>
          )}

          {!!recurrenceLabel && (
            <View style={styles.recurrenceChip}>
              <IoniconIcon
                name="repeat-outline"
                size={12}
                color={theme.background}
              />
              <Text style={styles.recurrenceChipText}>{recurrenceLabel}</Text>
            </View>
          )}

          {!!item?.failureReason && (
            <View style={styles.failureBanner}>
              <IoniconIcon name="warning-outline" size={14} color="#E5484D" />
              <Text style={styles.failureBannerText}>{item.failureReason}</Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() => handleEdit(item)}>
              <IoniconIcon
                name="create-outline"
                size={14}
                color={theme.background}
              />
              <Text style={styles.editButtonText}>{'Edit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.7}
              onPress={() => handleDelete(item?.id)}>
              <IoniconIcon name="trash-outline" size={14} color="#E5484D" />
              <Text style={styles.deleteButtonText}>{'Remove'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [handleDelete, handleEdit, styles, theme.background, theme.gray],
  );

  return (
    <DokSafeAreaView style={styles.container}>
      <FlatList
        data={sortedPayments}
        keyExtractor={item => item?.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          sortedPayments?.length ? (
            <Text style={styles.summaryText}>
              {`${sortedPayments.length} scheduled payment${
                sortedPayments.length === 1 ? '' : 's'
              }`}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <IoniconIcon
                name="calendar-outline"
                size={28}
                color={theme.gray}
              />
            </View>
            <Text style={styles.emptyTitle}>{'No scheduled payments yet'}</Text>
            <Text style={styles.emptyText}>
              {
                'Tap "Add" to schedule a payment and we\'ll remind you when it\'s time to send it.'
              }
            </Text>
          </View>
        }
      />
    </DokSafeAreaView>
  );
};

export default ViewSchedulePayment;
