import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {v4} from 'uuid';
import {useDispatch, useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import BigNumber from 'bignumber.js';
import myStyles from './SchedulePaymentStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {
  selectCurrentCoin,
  selectCurrentWallet,
  selectCurrentWalletClientId,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  addScheduledPayment,
  updateScheduledPayment,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {
  isNameSupportChain,
  multiplyBNWithFixed,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {
  getCustomRPCWithData,
  selectAllCustomRpc,
} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSelectors';
import {useLocalNotification} from 'providers/hooks/useLocalNotification';
import RecipientAddressInput from 'components/RecipientAddressInput';
import {currencySymbol} from 'data/currency';
import {
  CUSTOM_UNIT,
  MAX_OCCURRENCES,
  REPEAT_TYPE,
  WEEKDAYS,
  computeOccurrences,
} from 'utils/scheduleRecurrence';

dayjs.extend(customParseFormat);

const SCHEDULED_DATE_FORMAT = 'YYYY-MM-DD HH:mm';

const REPEAT_OPTIONS = [
  {value: REPEAT_TYPE.NONE, label: 'Does not repeat'},
  {value: REPEAT_TYPE.DAILY, label: 'Daily'},
  {value: REPEAT_TYPE.WEEKLY, label: 'Weekly'},
  {value: REPEAT_TYPE.MONTHLY, label: 'Monthly'},
  {value: REPEAT_TYPE.YEARLY, label: 'Yearly'},
  {value: REPEAT_TYPE.CUSTOM, label: 'Custom'},
];

const CUSTOM_UNIT_OPTIONS = [
  {value: CUSTOM_UNIT.DAY, label: 'Days'},
  {value: CUSTOM_UNIT.WEEK, label: 'Weeks'},
  {value: CUSTOM_UNIT.MONTH, label: 'Months'},
];

const getInitialValues = (editingPayment, currencyRate) => {
  if (!editingPayment) {
    return {
      toAddress: '',
      amount: '',
      currencyAmount: '',
      scheduledDate: '',
      repeatType: REPEAT_TYPE.NONE,
      repeatInterval: '1',
      repeatUnit: CUSTOM_UNIT.DAY,
      weeklyDays: [],
    };
  }
  const recurrence = editingPayment.recurrence || {type: REPEAT_TYPE.NONE};
  return {
    toAddress: editingPayment.recipientAddress || '',
    amount: editingPayment.amount != null ? String(editingPayment.amount) : '',
    currencyAmount:
      editingPayment.amount != null
        ? multiplyBNWithFixed(editingPayment.amount, currencyRate, 2)
        : '',
    scheduledDate: editingPayment.scheduledAt
      ? dayjs(editingPayment.scheduledAt).format(SCHEDULED_DATE_FORMAT)
      : '',
    repeatType: recurrence.type || REPEAT_TYPE.NONE,
    repeatInterval:
      recurrence.type === REPEAT_TYPE.CUSTOM
        ? String(recurrence.interval || 1)
        : '1',
    repeatUnit: recurrence.unit || CUSTOM_UNIT.DAY,
    weeklyDays: Array.isArray(recurrence.weeklyDays)
      ? recurrence.weeklyDays
      : [],
  };
};

const buildRecurrence = values => {
  if (values.repeatType === REPEAT_TYPE.NONE) {
    return {type: REPEAT_TYPE.NONE};
  }
  const recurrence = {
    type: values.repeatType,
    interval:
      values.repeatType === REPEAT_TYPE.CUSTOM
        ? Math.max(1, parseInt(values.repeatInterval, 10) || 1)
        : 1,
  };
  if (values.repeatType === REPEAT_TYPE.CUSTOM) {
    recurrence.unit = values.repeatUnit;
  }
  if (values.repeatType === REPEAT_TYPE.WEEKLY) {
    recurrence.weeklyDays = values.weeklyDays.length
      ? values.weeklyDays
      : [dayjs(values.scheduledDate, SCHEDULED_DATE_FORMAT, true).day()];
  }
  return recurrence;
};

const SchedulePayment = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const currentCoin = useSelector(selectCurrentCoin);
  const currentWallet = useSelector(selectCurrentWallet);
  const allCustomRPC = useSelector(selectAllCustomRpc);
  const walletClientId = useSelector(selectCurrentWalletClientId);
  const localCurrency = useSelector(getLocalCurrency);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    requestLocalNotificationPermission,
    createScheduledPaymentNotification,
    cancelScheduledPaymentNotification,
  } = useLocalNotification();
  const qrAddress = route?.params?.qrAddress;
  const editingPayment = route?.params?.scheduledPayment;
  const isEditMode = !!editingPayment?.id;

  const availableAmount = useMemo(() => {
    const amount = currentCoin?.totalAmount || '0';
    const minBalance = currentCoin?.minimumBalance || '0';
    const localAvailableAmount = new BigNumber(amount).minus(
      new BigNumber(minBalance),
    );
    const zeroAmount = new BigNumber(0);
    return localAvailableAmount.gt(zeroAmount)
      ? localAvailableAmount.toFixed()
      : zeroAmount.toFixed();
  }, [currentCoin?.minimumBalance, currentCoin?.totalAmount]);
  const availableAmountCurrency = useMemo(() => {
    return multiplyBNWithFixed(availableAmount, currentCoin?.currencyRate, 2);
  }, [availableAmount, currentCoin?.currencyRate]);

  useLayoutEffect(() => {
    navigation?.setOptions({
      title: isEditMode ? 'Edit Scheduled Payment' : 'Schedule Payment',
    });
  }, [navigation, isEditMode]);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    setFieldError,
  } = useFormik({
    initialValues: getInitialValues(editingPayment, currentCoin?.currencyRate),
    validationSchema: Yup.object().shape({
      toAddress: Yup.string().required('Recipient address is required'),
      amount: Yup.number()
        .typeError('Amount must be a number')
        .positive('Amount must be greater than 0')
        .required('Amount is required'),
      scheduledDate: Yup.string()
        .required('Scheduled date is required')
        .test(
          'is-valid-date',
          `Use the format ${SCHEDULED_DATE_FORMAT}`,
          value =>
            !!value && dayjs(value, SCHEDULED_DATE_FORMAT, true).isValid(),
        )
        .test(
          'is-future-date',
          'Scheduled date must be in the future',
          value =>
            !value ||
            !dayjs(value, SCHEDULED_DATE_FORMAT, true).isValid() ||
            dayjs(value, SCHEDULED_DATE_FORMAT, true).valueOf() > Date.now(),
        ),
      repeatInterval: Yup.number()
        .typeError('Enter a number')
        .integer('Enter a whole number')
        .min(1, 'Must be at least 1')
        .when('repeatType', {
          is: REPEAT_TYPE.CUSTOM,
          then: schema => schema.required('Interval is required'),
        }),
    }),
    onSubmit: async submittedValue => {
      setIsSubmitting(true);
      const scheduledAt = dayjs(
        submittedValue.scheduledDate,
        SCHEDULED_DATE_FORMAT,
        true,
      ).valueOf();
      let recipientAddress = submittedValue.toAddress?.trim();
      const chainName = isEditMode
        ? editingPayment.chain
        : currentCoin?.chain_name;

      // SendFunds blocks an invalid recipient before it ever reaches the
      // chain layer; a scheduled payment only gets validated here, since it
      // is built and broadcast later with no user in the loop. An address
      // that's malformed for this chain (e.g. wrong-length/format) can
      // otherwise still get SCALE/RLP-encoded into a transaction and blow up
      // fee estimation with a cryptic decode error when the reminder fires.
      const customRPC = getCustomRPCWithData(
        allCustomRPC,
        chainName,
        currentWallet?.clientId,
      );
      const currentChain = getChain(
        chainName,
        currentWallet?.phrase,
        customRPC,
      );
      const isValid = await currentChain.isValidAddress({
        address: recipientAddress,
      });
      if (!isValid) {
        let validAddress = null;
        if (isNameSupportChain(chainName)) {
          validAddress = await currentChain?.isValidName({
            name: recipientAddress,
          });
        }
        if (!validAddress) {
          setIsSubmitting(false);
          setFieldTouched('toAddress', true);
          setFieldError('toAddress', 'Enter a valid recipient address');
          return;
        }
        recipientAddress = validAddress;
      }

      const recurrence = buildRecurrence(submittedValue);
      const occurrences = computeOccurrences({scheduledAt, recurrence});
      const id = isEditMode ? editingPayment.id : v4();
      const asset = isEditMode
        ? editingPayment.asset
        : {
            symbol: currentCoin?.symbol,
            contractAddress: currentCoin?.contractAddress,
            decimals: currentCoin?.decimal,
          };

      // Reminders are the only way a scheduled payment gets acted on — don't
      // create/update the schedule at all if we can't notify the user.
      const {granted, blocked} = await requestLocalNotificationPermission();
      if (!granted) {
        setIsSubmitting(false);
        Alert.alert(
          'Notifications disabled',
          blocked
            ? 'Notifications must be enabled to schedule a payment reminder. Enable them in your device settings, then try again.'
            : 'Notifications must be enabled to schedule a payment reminder.',
          blocked
            ? [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            : [{text: 'OK'}],
        );
        return;
      }

      if (isEditMode) {
        dispatch(
          updateScheduledPayment({
            id,
            changes: {
              recipientAddress,
              amount: submittedValue.amount,
              scheduledAt,
              recurrence,
              status: 'scheduled',
              failureReason: null,
            },
          }),
        );
        await cancelScheduledPaymentNotification(id);
      } else {
        dispatch(
          addScheduledPayment({
            id,
            chain: currentCoin?.chain_name,
            asset,
            senderAddress: currentCoin?.address,
            recipientAddress,
            amount: submittedValue.amount,
            scheduledAt,
            recurrence,
          }),
        );
      }

      const {scheduled: notificationScheduled} =
        await createScheduledPaymentNotification({
          id,
          asset,
          recipientAddress,
          amount: submittedValue.amount,
          scheduledAt,
          occurrences,
          walletClientId,
        });
      setIsSubmitting(false);
      const actionLabel = isEditMode ? 'updated' : 'scheduled';
      Toast.show({
        type: 'successToast',
        text1:
          occurrences.length > 1
            ? `Payment ${actionLabel} (${occurrences.length} reminders)`
            : `Payment ${actionLabel}`,
        text2: notificationScheduled
          ? "We'll remind you at the scheduled time"
          : 'Reminder could not be scheduled',
      });
      navigation.navigate('ViewSchedulePayment');
    },
  });

  useEffect(() => {
    if (qrAddress) {
      setFieldValue('toAddress', qrAddress);
    }
  }, [qrAddress, setFieldValue]);

  const onSelectAddress = item => {
    if (item?.address) {
      setFieldValue('toAddress', item.address);
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);

  const applyScheduledDate = date => {
    setFieldValue('scheduledDate', dayjs(date).format(SCHEDULED_DATE_FORMAT));
    setFieldTouched('scheduledDate', true);
  };

  const openDateTimePicker = () => {
    const current = dayjs(values.scheduledDate, SCHEDULED_DATE_FORMAT, true);
    setPendingDate(current.isValid() ? current.toDate() : new Date());
    setShowDatePicker(true);
  };

  const onSelectDate = (event, selectedDate) => {
    if (!selectedDate) {
      setShowDatePicker(false);
      return;
    }
    if (Platform.OS === 'ios') {
      // iOS spinner is inline and fires on every wheel tick, not a one-shot
      // dialog like Android's — keep it open and stage the value; the user
      // confirms with the Done button below.
      setPendingDate(selectedDate);
    } else {
      setShowDatePicker(false);
      setPendingDate(selectedDate);
      setShowTimePicker(true);
    }
  };

  const onSelectTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (!selectedTime || !pendingDate) {
      return;
    }
    const combinedDate = new Date(pendingDate);
    combinedDate.setHours(selectedTime.getHours());
    combinedDate.setMinutes(selectedTime.getMinutes());
    applyScheduledDate(combinedDate);
  };

  const confirmIOSDate = () => {
    applyScheduledDate(pendingDate);
    setShowDatePicker(false);
  };

  const selectRepeatType = repeatType => {
    setFieldValue('repeatType', repeatType);
    if (repeatType === REPEAT_TYPE.WEEKLY && !values.weeklyDays.length) {
      const scheduled = dayjs(
        values.scheduledDate,
        SCHEDULED_DATE_FORMAT,
        true,
      );
      setFieldValue('weeklyDays', scheduled.isValid() ? [scheduled.day()] : []);
    }
  };

  const toggleWeeklyDay = day => {
    const next = values.weeklyDays.includes(day)
      ? values.weeklyDays.filter(d => d !== day)
      : [...values.weeklyDays, day];
    setFieldValue('weeklyDays', next);
  };

  const getInputTheme = error => ({
    colors: {
      onSurfaceVariant: '#989898',
      primary: error ? 'red' : '#989898',
    },
  });

  const isRepeating = values.repeatType !== REPEAT_TYPE.NONE;

  const displayScheduledDate = useMemo(() => {
    const parsed = dayjs(values.scheduledDate, SCHEDULED_DATE_FORMAT, true);
    return parsed.isValid()
      ? parsed.format('YYYY-MM-DD hh:mm A')
      : values.scheduledDate;
  }, [values.scheduledDate]);

  const recurrenceEndInfo = useMemo(() => {
    if (!isRepeating) {
      return null;
    }
    const parsed = dayjs(values.scheduledDate, SCHEDULED_DATE_FORMAT, true);
    if (!parsed.isValid()) {
      return null;
    }
    const occurrences = computeOccurrences({
      scheduledAt: parsed.valueOf(),
      recurrence: buildRecurrence(values),
    });
    if (occurrences.length < 2) {
      return null;
    }
    const format = ts => dayjs(ts).format('YYYY-MM-DD hh:mm A');
    return {
      // Includes occurrences[0], the start date currently in the
      // scheduledDate field above, so the preview stays in sync with it.
      upcoming: occurrences.slice(0, 5).map(format),
      endDate: format(occurrences[occurrences.length - 1]),
      count: occurrences.length,
    };
  }, [isRepeating, values]);

  return (
    <DokSafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.mainContainer}
          keyboardShouldPersistTaps={'handled'}>
          <View style={styles.formInput}>
            <Text style={styles.title}>{'Amount available for send'}</Text>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>{availableAmount}</Text>
              <Text style={styles.boxTitle}>{' ' + currentCoin?.symbol}</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxBalance}>
                {currencySymbol[localCurrency] || ''}
                {availableAmountCurrency}
              </Text>
            </View>

            <Text style={styles.label}>{`Send ${
              isEditMode ? editingPayment?.asset?.symbol : currentCoin?.symbol
            } to`}</Text>
            <RecipientAddressInput
              chain_name={
                isEditMode ? editingPayment?.chain : currentCoin?.chain_name
              }
              walletId={walletClientId}
              onSelectAddress={onSelectAddress}
              error={touched.toAddress && errors.toAddress}
              onChangeText={handleChange('toAddress')}
              onBlur={handleBlur('toAddress')}
              value={values.toAddress}
              onPressScan={() => {
                navigation.navigate('Scanner', {
                  page: 'SchedulePayment',
                });
              }}
            />

            <Text style={styles.label}>{'Amount'}</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.input}
                mode="outlined"
                placeholder={'0.00'}
                keyboardType="decimal-pad"
                textColor={theme.font}
                theme={getInputTheme(errors.amount)}
                outlineColor={
                  touched.amount && errors.amount ? 'red' : '#989898'
                }
                activeOutlineColor={
                  touched.amount && errors.amount
                    ? 'red'
                    : theme.borderActiveColor
                }
                onChangeText={text => {
                  const tempAmount = validateNumberInInput(
                    text,
                    currentCoin?.decimal,
                  );
                  setFieldValue('amount', tempAmount);
                  setFieldValue(
                    'currencyAmount',
                    multiplyBNWithFixed(
                      tempAmount,
                      currentCoin?.currencyRate,
                      2,
                    ),
                  );
                }}
                onBlur={handleBlur('amount')}
                value={values.amount}
              />
              <TouchableOpacity
                style={styles.btnMax}
                hitSlop={{top: 12, left: 12, right: 12, bottom: 12}}
                onPress={() => {
                  setFieldValue('amount', availableAmount);
                  setFieldValue('currencyAmount', availableAmountCurrency);
                }}>
                <Text style={styles.btnText}>{'Max'}</Text>
              </TouchableOpacity>
            </View>
            {touched.amount && errors.amount && (
              <Text style={styles.textConfirm}>{errors.amount}</Text>
            )}

            <Text style={styles.label}>{`${localCurrency || ''} Amount`}</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.input}
                mode="outlined"
                placeholder={'0.00'}
                keyboardType="decimal-pad"
                textColor={theme.font}
                theme={getInputTheme(errors.amount)}
                outlineColor={
                  touched.amount && errors.amount ? 'red' : '#989898'
                }
                activeOutlineColor={
                  touched.amount && errors.amount
                    ? 'red'
                    : theme.borderActiveColor
                }
                onChangeText={text => {
                  const tempCurrencyAmount = validateNumberInInput(text, 2);
                  setFieldValue('currencyAmount', tempCurrencyAmount);
                  setFieldValue(
                    'amount',
                    new BigNumber(tempCurrencyAmount || 0)
                      .dividedBy(new BigNumber(currentCoin?.currencyRate || 1))
                      .toFixed(Number(currentCoin?.decimal)),
                  );
                }}
                onBlur={handleBlur('currencyAmount')}
                value={values.currencyAmount}
              />
              <TouchableOpacity
                style={styles.btnMax}
                hitSlop={{top: 12, left: 12, right: 12, bottom: 12}}
                onPress={() => {
                  setFieldValue('amount', availableAmount);
                  setFieldValue('currencyAmount', availableAmountCurrency);
                }}>
                <Text style={styles.btnText}>{'Max'}</Text>
              </TouchableOpacity>
            </View>
            {touched.amount && errors.amount && (
              <Text style={styles.textConfirm}>{errors.amount}</Text>
            )}

            <Text style={styles.label}>{'Scheduled date & time'}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={openDateTimePicker}>
              <View pointerEvents="none">
                <TextInput
                  style={styles.input}
                  mode="outlined"
                  placeholder={'YYYY-MM-DD hh:mm AM/PM'}
                  textColor={theme.font}
                  theme={getInputTheme(errors.scheduledDate)}
                  outlineColor={
                    touched.scheduledDate && errors.scheduledDate
                      ? 'red'
                      : '#989898'
                  }
                  activeOutlineColor={
                    touched.scheduledDate && errors.scheduledDate
                      ? 'red'
                      : theme.borderActiveColor
                  }
                  editable={false}
                  value={displayScheduledDate}
                />
              </View>
            </TouchableOpacity>
            {touched.scheduledDate && errors.scheduledDate && (
              <Text style={styles.textConfirm}>{errors.scheduledDate}</Text>
            )}
            {showDatePicker && (
              <>
                <DateTimePicker
                  value={pendingDate || new Date()}
                  mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onValueChange={onSelectDate}
                  onDismiss={() => setShowDatePicker(false)}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={confirmIOSDate}>
                    <Text style={styles.buttonTitle}>{'Done'}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={pendingDate || new Date()}
                mode="time"
                display="default"
                onValueChange={onSelectTime}
                onDismiss={() => setShowTimePicker(false)}
              />
            )}

            <Text style={styles.label}>{'Repeat'}</Text>
            <View style={styles.optionsRow}>
              {REPEAT_OPTIONS.map(option => {
                const selected = values.repeatType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.7}
                    style={[
                      styles.optionPill,
                      selected && styles.optionPillSelected,
                    ]}
                    onPress={() => selectRepeatType(option.value)}>
                    <Text
                      style={[
                        styles.optionPillText,
                        selected && styles.optionPillTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {values.repeatType === REPEAT_TYPE.WEEKLY && (
              <>
                <Text style={styles.sublabel}>{'On days'}</Text>
                <View style={styles.optionsRow}>
                  {WEEKDAYS.map(day => {
                    const selected = values.weeklyDays.includes(day.value);
                    return (
                      <TouchableOpacity
                        key={day.value}
                        activeOpacity={0.7}
                        style={[
                          styles.dayChip,
                          selected && styles.dayChipSelected,
                        ]}
                        onPress={() => toggleWeeklyDay(day.value)}>
                        <Text
                          style={[
                            styles.dayChipText,
                            selected && styles.dayChipTextSelected,
                          ]}>
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {values.repeatType === REPEAT_TYPE.CUSTOM && (
              <>
                <Text style={styles.sublabel}>{'Every'}</Text>
                <View style={styles.customRow}>
                  <TextInput
                    style={styles.customInput}
                    mode="outlined"
                    keyboardType="number-pad"
                    textColor={theme.font}
                    theme={getInputTheme(errors.repeatInterval)}
                    outlineColor={
                      touched.repeatInterval && errors.repeatInterval
                        ? 'red'
                        : '#989898'
                    }
                    activeOutlineColor={
                      touched.repeatInterval && errors.repeatInterval
                        ? 'red'
                        : theme.borderActiveColor
                    }
                    onChangeText={handleChange('repeatInterval')}
                    onBlur={handleBlur('repeatInterval')}
                    value={values.repeatInterval}
                  />
                  <View style={styles.optionsRow}>
                    {CUSTOM_UNIT_OPTIONS.map(option => {
                      const selected = values.repeatUnit === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          activeOpacity={0.7}
                          style={[
                            styles.optionPill,
                            selected && styles.optionPillSelected,
                          ]}
                          onPress={() =>
                            setFieldValue('repeatUnit', option.value)
                          }>
                          <Text
                            style={[
                              styles.optionPillText,
                              selected && styles.optionPillTextSelected,
                            ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                {touched.repeatInterval && errors.repeatInterval && (
                  <Text style={styles.textConfirm}>
                    {errors.repeatInterval}
                  </Text>
                )}
              </>
            )}

            {recurrenceEndInfo && (
              <>
                {recurrenceEndInfo.upcoming.length > 0 && (
                  <>
                    <Text style={styles.sublabel}>{'Next occurrences'}</Text>
                    {recurrenceEndInfo.upcoming.map(date => (
                      <Text key={date} style={styles.boxBalance}>
                        {date}
                      </Text>
                    ))}
                  </>
                )}
                <Text style={styles.sublabel}>{'Ends'}</Text>
                <Text style={styles.boxBalance}>
                  {`${recurrenceEndInfo.endDate} (after ${recurrenceEndInfo.count} occurrences)`}
                </Text>
              </>
            )}

            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                {isRepeating
                  ? `We'll send you a reminder notification for each occurrence (up to ${MAX_OCCURRENCES}). Payments are not sent automatically — you'll need to confirm and send each one yourself.`
                  : "We'll send you a reminder notification at the scheduled time. Payments are not sent automatically yet — you'll need to confirm and send it yourself."}
              </Text>
            </View>

            <TouchableOpacity
              disabled={isSubmitting}
              style={[
                styles.button,
                {
                  backgroundColor: isSubmitting ? theme.gray : theme.background,
                },
              ]}
              onPress={handleSubmit}>
              {isSubmitting ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Text style={styles.buttonTitle}>
                  {isEditMode ? 'Update Payment' : 'Schedule Payment'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </DokSafeAreaView>
  );
};

export default SchedulePayment;
