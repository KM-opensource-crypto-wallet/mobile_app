import React, {useContext, useLayoutEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {useFormik} from 'formik';
import dayjs from 'dayjs';
import {useDispatch, useSelector} from 'react-redux';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import myStyles from './SchedulePaymentStyles';
import sendFundsFormStyles from 'components/SendFundsForm/SendFundsFormStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import SendFundsForm from 'components/SendFundsForm';
import DatePicker from 'components/DatePicker';
import ModalAddressPoisoningWarning from 'components/ModalAddressPoisoningWarning';
import useSendFundsForm from 'hooks/useSendFundsForm';
import useSendFormPrefill from 'hooks/useSendFormPrefill';
import {
  selectCurrentCoin,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {multiplyBNWithFixed} from 'dok-wallet-blockchain-networks/helper';
import {submitScheduledPayment} from 'dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSlice';
import {selectIsSubmittingSchedulePayment} from 'dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSelectors';
import {IS_ANDROID} from 'utils/dimensions';
import {showToast} from 'utils/toast';
import {openAppNotificationSettings} from 'utils/openNotificationSettings';
import {validationSchemaSchedulePayment} from 'utils/validationSchema';
import {findCoinForScheduledPayment} from 'utils/scheduledPaymentCoin';
import {
  CUSTOM_UNIT,
  MAX_OCCURRENCES,
  REPEAT_TYPE,
  SCHEDULED_DATE_FORMAT,
  WEEKDAYS,
  buildRecurrence,
  computeOccurrences,
} from 'utils/scheduleRecurrence';

const REPEAT_OPTIONS = [
  {value: REPEAT_TYPE.NONE, label: 'Does not repeat'},
  {value: REPEAT_TYPE.DAILY, label: 'Daily'},
  {value: REPEAT_TYPE.WEEKLY, label: 'Weekly'},
  {value: REPEAT_TYPE.MONTHLY, label: 'Monthly'},
  {value: REPEAT_TYPE.CUSTOM, label: 'Custom'},
];

const CUSTOM_UNIT_OPTIONS = [
  {value: CUSTOM_UNIT.DAY, label: 'Days'},
  {value: CUSTOM_UNIT.WEEK, label: 'Weeks'},
  {value: CUSTOM_UNIT.MONTH, label: 'Months'},
];

const DISPLAY_DATE_FORMAT = 'YYYY-MM-DD hh:mm A';
const INVALID_ADDRESS_MESSAGE = 'Enter a valid recipient address';

const getInitialValues = (editingPayment, currencyRate) => {
  if (!editingPayment) {
    return {
      toAddress: '',
      amount: '',
      currencyAmount: '',
      memo: '',
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
    memo: editingPayment.memo || '',
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

const SchedulePayment = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const formStyles = sendFundsFormStyles(theme);
  const dispatch = useDispatch();
  const currentCoin = useSelector(selectCurrentCoin);
  const currentWallet = useSelector(selectCurrentWallet);
  const localCurrency = useSelector(getLocalCurrency);
  const isSubmitting = useSelector(selectIsSubmittingSchedulePayment);

  const {
    qrAddress,
    qrAmount,
    memo: scannedMemo,
    newDateToString,
    scheduledPayment: editingPayment,
  } = route?.params || {};
  const isEditMode = !!editingPayment?.id;

  // A scheduled payment stores chain + asset, not a coin id, and the coin
  // selected on Home may be a different one while editing.
  const formCoin = useMemo(
    () =>
      (isEditMode &&
        findCoinForScheduledPayment(currentWallet, editingPayment)) ||
      currentCoin,
    [isEditMode, currentWallet, editingPayment, currentCoin],
  );

  const form = useSendFundsForm({coin: formCoin, wallet: currentWallet});
  const {availableAmount} = form;
  const initialValues = useMemo(
    () => getInitialValues(editingPayment, formCoin?.currencyRate),
    [editingPayment, formCoin?.currencyRate],
  );
  const validationSchema = useMemo(
    () =>
      validationSchemaSchedulePayment({
        balanceAmount: availableAmount,
        initialScheduledDate: isEditMode ? initialValues.scheduledDate : null,
      }),
    [availableAmount, isEditMode, initialValues.scheduledDate],
  );

  useLayoutEffect(() => {
    navigation?.setOptions({
      title: isEditMode ? 'Edit Scheduled Payment' : 'Schedule Payment',
    });
  }, [navigation, isEditMode]);

  const submitSchedule = async (values, helpers) => {
    try {
      const {occurrences} = await dispatch(
        submitScheduledPayment({values, editingPayment}),
      ).unwrap();
      const actionLabel = isEditMode ? 'updated' : 'scheduled';
      showToast({
        type: 'successToast',
        title:
          occurrences.length > 1
            ? `Payment ${actionLabel} (${occurrences.length} occurrences)`
            : `Payment ${actionLabel}`,
        message: "We'll remind you at the scheduled time",
      });
      // Back to the list if it is already in the stack (opened via Add or
      // Edit), otherwise replace this form with it (opened from Send) — in
      // React Navigation 7 `navigate` always pushes, so it would stack a
      // second list on top.
      navigation.popTo('ViewSchedulePayment');
    } catch (rejection) {
      if (rejection?.type === 'invalidAddress') {
        helpers.setFieldTouched('toAddress', true, false);
        helpers.setFieldError('toAddress', INVALID_ADDRESS_MESSAGE);
        return;
      }
      if (rejection?.type === 'notificationBlocked') {
        Alert.alert(
          'Notifications disabled',
          rejection?.blocked
            ? 'Notifications must be enabled to schedule a payment reminder. Enable them in your device settings, then try again.'
            : 'Notifications must be enabled to schedule a payment reminder.',
          rejection?.blocked
            ? [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Open Settings',
                  onPress: openAppNotificationSettings,
                },
              ]
            : [{text: 'OK'}],
        );
        return;
      }
      if (rejection?.type === 'reminderLimitExceeded') {
        const {existing, required, limit} = rejection;
        Alert.alert(
          'Reminder limit reached',
          `This payment needs ${required} reminder slot${
            required === 1 ? '' : 's'
          }, but ${existing} of ${limit} are already used on this device. Delete or shorten an existing scheduled payment — each card in the list shows how many slots it uses.`,
        );
        return;
      }
      if (rejection?.type === 'reminderFailed') {
        Alert.alert(
          'Reminder could not be scheduled',
          isEditMode
            ? 'Your changes were not saved because the reminder could not be scheduled. Please try again.'
            : 'This payment was not scheduled because the reminder could not be created. Please try again.',
        );
      }
    }
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, helpers) => {
      if (form.applyChainRules(values, helpers)) {
        return;
      }
      const {resolvedAddress} = await form.resolveRecipient(values.toAddress);
      if (!resolvedAddress) {
        helpers.setFieldError('toAddress', INVALID_ADDRESS_MESSAGE);
        return;
      }
      form.checkPoisoningThenProceed(resolvedAddress, () =>
        submitSchedule(values, helpers),
      );
    },
  });
  const {values, errors, touched, handleChange, handleBlur, setFieldValue} =
    formik;

  useSendFormPrefill(
    formik,
    {
      address: qrAddress,
      amount: qrAmount,
      memo: scannedMemo,
      refreshKey: newDateToString,
    },
    {isLightning: form.isLightning, currencyRate: formCoin?.currencyRate},
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const scheduledDateValue = useMemo(() => {
    const parsed = dayjs(values.scheduledDate, SCHEDULED_DATE_FORMAT, true);
    return parsed.isValid() ? parsed.toDate() : null;
  }, [values.scheduledDate]);

  const onConfirmScheduledDate = date => {
    // Mark touched without validating: setFieldValue already validates with
    // the new value, and a second validation from setFieldTouched would run
    // against the previous values and overwrite that result.
    formik.setFieldTouched('scheduledDate', true, false);
    setFieldValue('scheduledDate', dayjs(date).format(SCHEDULED_DATE_FORMAT));
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

  const isRepeating = values.repeatType !== REPEAT_TYPE.NONE;
  const scheduledDateError = touched.scheduledDate && errors.scheduledDate;
  const repeatIntervalError = touched.repeatInterval && errors.repeatInterval;

  const displayScheduledDate = useMemo(() => {
    const parsed = dayjs(values.scheduledDate, SCHEDULED_DATE_FORMAT, true);
    return parsed.isValid()
      ? parsed.format(DISPLAY_DATE_FORMAT)
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
    // An in-progress series (editing a repeating payment that has begun)
    // previews only what is still to come, so it matches the reminders
    // actually pending.
    const now = Date.now();
    const remaining = occurrences.filter(ts => ts > now);
    const format = ts => dayjs(ts).format(DISPLAY_DATE_FORMAT);
    return {
      upcoming: remaining.slice(0, 5).map(format),
      endDate: format(occurrences[occurrences.length - 1]),
      count: occurrences.length,
      remaining: remaining.length,
    };
  }, [isRepeating, values]);

  const renderPills = (options, selectedValue, onSelect) => (
    <View style={styles.optionsRow}>
      {options.map(option => {
        const selected = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.7}
            style={[styles.optionPill, selected && styles.optionPillSelected]}
            onPress={() => onSelect(option.value)}>
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
  );

  const submitDisabled = isSubmitting || !formik.isValid;

  return (
    <DokSafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        bounces={false}
        keyboardShouldPersistTaps={'always'}
        {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
        keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
        contentContainerStyle={styles.contentContainerStyle}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.formInput}>
            <SendFundsForm
              formik={formik}
              form={form}
              coin={formCoin}
              wallet={currentWallet}
              localCurrency={localCurrency}
              navigation={navigation}
              scannerPage="SchedulePayment"
              recipientLabel={`Send ${formCoin?.symbol || ''} to`}>
              <View style={formStyles.boxInput}>
                <Text style={formStyles.listTitle}>Scheduled date & time</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(true)}>
                  <View pointerEvents="none">
                    <TextInput
                      style={formStyles.input}
                      mode="outlined"
                      label="YYYY-MM-DD hh:mm AM/PM"
                      textColor={theme.font}
                      theme={{colors: {onSurfaceVariant: theme.gray}}}
                      outlineColor={scheduledDateError ? 'red' : theme.gray}
                      activeOutlineColor={
                        scheduledDateError ? 'red' : theme.font
                      }
                      editable={false}
                      value={displayScheduledDate}
                    />
                  </View>
                </TouchableOpacity>
                {!!scheduledDateError && (
                  <Text style={formStyles.textConfirm}>
                    {scheduledDateError}
                  </Text>
                )}
              </View>

              <View style={formStyles.boxInput}>
                <Text style={formStyles.listTitle}>Repeat</Text>
                {renderPills(
                  REPEAT_OPTIONS,
                  values.repeatType,
                  selectRepeatType,
                )}
              </View>

              {values.repeatType === REPEAT_TYPE.WEEKLY && (
                <>
                  <Text style={styles.sublabel}>On days</Text>
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
                  <Text style={styles.sublabel}>Every</Text>
                  <View style={styles.customRow}>
                    <TextInput
                      style={styles.customInput}
                      mode="outlined"
                      keyboardType="number-pad"
                      textColor={theme.font}
                      theme={{colors: {onSurfaceVariant: theme.gray}}}
                      outlineColor={repeatIntervalError ? 'red' : theme.gray}
                      activeOutlineColor={
                        repeatIntervalError ? 'red' : theme.font
                      }
                      onChangeText={handleChange('repeatInterval')}
                      onBlur={handleBlur('repeatInterval')}
                      value={values.repeatInterval}
                    />
                    {renderPills(CUSTOM_UNIT_OPTIONS, values.repeatUnit, unit =>
                      setFieldValue('repeatUnit', unit),
                    )}
                  </View>
                  {!!repeatIntervalError && (
                    <Text style={formStyles.textConfirm}>
                      {repeatIntervalError}
                    </Text>
                  )}
                </>
              )}

              {recurrenceEndInfo && (
                <>
                  <Text style={styles.sublabel}>Next occurrences</Text>
                  {recurrenceEndInfo.upcoming.map(date => (
                    <Text key={date} style={formStyles.boxBalance}>
                      {date}
                    </Text>
                  ))}
                  <Text style={styles.sublabel}>Ends</Text>
                  <Text style={formStyles.boxBalance}>
                    {recurrenceEndInfo.remaining < recurrenceEndInfo.count
                      ? `${recurrenceEndInfo.endDate} (${recurrenceEndInfo.remaining} of ${recurrenceEndInfo.count} remaining)`
                      : `${recurrenceEndInfo.endDate} (after ${recurrenceEndInfo.count} occurrences)`}
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
            </SendFundsForm>

            <TouchableOpacity
              disabled={submitDisabled}
              style={[
                styles.button,
                {
                  backgroundColor: submitDisabled
                    ? theme.gray
                    : theme.background,
                },
              ]}
              onPress={formik.handleSubmit}>
              {isSubmitting ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Text style={styles.buttonTitle}>
                  {isEditMode ? 'Update Payment' : 'Schedule Payment'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
      <DatePicker
        visible={showDatePicker}
        value={scheduledDateValue}
        minimumDate={new Date()}
        title="Scheduled date & time"
        onConfirm={onConfirmScheduledDate}
        onCancel={() => setShowDatePicker(false)}
      />
      <ModalAddressPoisoningWarning
        visible={!!form.poisonWarning}
        suspiciousAddress={form.poisonWarning?.suspiciousAddress}
        matchedAddress={form.poisonWarning?.matchedAddress}
        onCancel={form.cancelPoisonWarning}
        onContinue={form.confirmPoisonWarning}
      />
    </DokSafeAreaView>
  );
};

export default SchedulePayment;
