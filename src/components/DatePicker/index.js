import React, {useContext, useEffect, useState} from 'react';
import {Modal, Platform, Text, TouchableOpacity, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {ThemeContext, darkTheme} from 'theme/ThemeContext';
import myStyles from './DatePickerStyles';

const IS_IOS = Platform.OS === 'ios';

// Merge the time from one Date onto the day of another.
const combineDateAndTime = (day, time) => {
  const combined = new Date(day);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
};

/**
 * Date & time picker that opens as a modal and only reports a value once the
 * user confirms it.
 *
 * iOS: a centered modal card with the iOS 14+ inline calendar (mode
 * "datetime") and Cancel / Done buttons. The inline picker fires on every
 * tap, so the selection is staged and only sent on Done.
 *
 * Android: the native date dialog followed by the native time dialog (Android
 * has no combined "datetime" mode). The system dialogs are already modal, so
 * nothing else is rendered; dismissing either dialog cancels.
 *
 * Props: visible, value (Date|null), minimumDate, title, onConfirm(date),
 * onCancel().
 */
const DatePicker = ({
  visible,
  value,
  minimumDate,
  title = 'Select date & time',
  onConfirm,
  onCancel,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [pendingDate, setPendingDate] = useState(value || new Date());
  const [androidStep, setAndroidStep] = useState('date');

  // Restart from the caller's value each time the picker is opened.
  useEffect(() => {
    if (visible) {
      setPendingDate(value || new Date());
      setAndroidStep('date');
    }
  }, [visible, value]);

  if (!visible) {
    return null;
  }

  if (IS_IOS) {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={onCancel}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <DateTimePicker
              style={styles.picker}
              value={pendingDate}
              mode="datetime"
              display="inline"
              minimumDate={minimumDate}
              accentColor={theme.background}
              themeVariant={theme === darkTheme ? 'dark' : 'light'}
              onValueChange={(event, selectedDate) => {
                if (selectedDate) {
                  setPendingDate(selectedDate);
                }
              }}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.button, styles.confirmButton]}
                onPress={() => onConfirm?.(pendingDate)}>
                <Text style={styles.confirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (androidStep === 'date') {
    return (
      <DateTimePicker
        value={pendingDate}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        onValueChange={(event, selectedDate) => {
          if (!selectedDate) {
            onCancel?.();
            return;
          }
          setPendingDate(selectedDate);
          setAndroidStep('time');
        }}
        onDismiss={onCancel}
      />
    );
  }

  return (
    <DateTimePicker
      value={pendingDate}
      mode="time"
      display="default"
      onValueChange={(event, selectedTime) => {
        if (!selectedTime) {
          onCancel?.();
          return;
        }
        onConfirm?.(combineDateAndTime(pendingDate, selectedTime));
      }}
      onDismiss={onCancel}
    />
  );
};

export default DatePicker;
