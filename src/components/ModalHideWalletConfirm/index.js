import React, {useContext} from 'react';
import {ScrollView, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {RELOCK_OPTIONS} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import myStyles from './ModalHideWalletConfirmStyles';

const RELOCK_DESCRIPTION = {
  [RELOCK_OPTIONS.RELAUNCH]:
    'It will re-hide once the app is fully quit and reopened.',
  [RELOCK_OPTIONS.BACKGROUND]:
    'It will re-hide as soon as the app is backgrounded, even briefly.',
  [RELOCK_OPTIONS.MANUAL]:
    'It will stay revealed until you manually turn this switch off.',
};

const INFO_BULLETS = [
  'Hiding a wallet removes it from the Wallets list and every screen that shows your wallets, including Address Book, Swap and Send/Receive etc.',
  "You'll set a secret code to hide it. The code itself is never stored - only a securely scrambled version of it is kept.",
  'To bring a hidden wallet back, search its exact secret code on the Wallets screen. Partial matches do not reveal it.',
  'Choose how it re-hides itself: on app relaunch (default), as soon as the app is backgrounded, or only when you manually turn this switch off.',
  'While backing up to Google Drive, hidden wallets are not backed up. Turn off Hide Wallet for this wallet if you want it included in your Google Drive backup.',
];

const CONFIRM_BULLETS = [
  'This wallet will disappear from the Wallets list and every screen that shows wallets, including Address Book, Swap and Send/Receive.',
  'The only way to bring it back is to search its exact secret code on the Wallets screen.',
  'While backing up to Google Drive, hidden wallets are not backed up. Turn off Hide Wallet for this wallet if you want it included in your Google Drive backup.',
];

const NOTIFICATION_INFO_BULLETS = [
  "This controls whether this wallet's notification alerts are deleted when the wallet is hidden.",
  "Enabled (default): all of this wallet's alerts are deleted, so nothing on your lock screen or notification tray reveals its activity.",
  "Deleted alerts are not restored when you unhide the wallet or turn this off - you'll need to re-create them from the Notification Alerts screen.",
  "Disabled: this wallet's alerts are kept and you'll keep receiving notifications even while it's hidden.",
];

const SCHEDULE_NOTIFICATION_INFO_BULLETS = [
  "This controls whether this wallet's scheduled payment reminders are cancelled when the wallet is hidden.",
  'Enabled (default): reminders for all of this wallet’s scheduled payments are deleted, so nothing on your lock screen or notification tray reveals its activity.',
  'Turning this off restores the reminders for any payments still scheduled in the future.',
  "Disabled: this wallet's scheduled payment reminders are kept and will still fire while it's hidden.",
];

const INFO_CONTENT = {
  info: {title: 'About Hide Wallet', bullets: INFO_BULLETS},
  notificationInfo: {
    title: 'About Delete Notifications',
    bullets: NOTIFICATION_INFO_BULLETS,
  },
  scheduleNotificationInfo: {
    title: 'About Delete Schedule Notifications',
    bullets: SCHEDULE_NOTIFICATION_INFO_BULLETS,
  },
};

const s = n => (n > 1 ? 's' : '');

const getNotificationConfirmBullet = (hideNotification, alertsCount) => {
  if (hideNotification) {
    return alertsCount > 0
      ? `Your ${alertsCount} notification alert${s(
          alertsCount,
        )} for this wallet will be deleted, so nothing on your lock screen reveals its activity. They won't be restored automatically.`
      : 'This wallet has no notification alerts - nothing will be deleted.';
  }
  return alertsCount > 0
    ? `Your ${alertsCount} notification alert${s(
        alertsCount,
      )} will be kept - you'll keep receiving notifications for this wallet while it's hidden.`
    : null;
};

const getScheduleNotificationConfirmBullet = (
  deleteScheduleNotification,
  scheduledPaymentsCount,
) => {
  if (deleteScheduleNotification) {
    return scheduledPaymentsCount > 0
      ? `Reminders for your ${scheduledPaymentsCount} scheduled payment${s(
          scheduledPaymentsCount,
        )} will be cancelled, so nothing on your lock screen reveals its activity.`
      : 'This wallet has no scheduled payments - nothing will be cancelled.';
  }
  return scheduledPaymentsCount > 0
    ? `Reminders for your ${scheduledPaymentsCount} scheduled payment${s(
        scheduledPaymentsCount,
      )} will be kept - they'll still fire for this wallet while it's hidden.`
    : null;
};

const ModalHideWalletConfirm = ({
  visible,
  mode = 'confirm',
  relockOption,
  hideNotification,
  alertsCount = 0,
  deleteScheduleNotification,
  scheduledPaymentsCount = 0,
  onConfirm,
  onCancel,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const isConfirmMode = mode === 'confirm';
  const infoContent = INFO_CONTENT[mode] || INFO_CONTENT.info;
  let bullets;
  if (isConfirmMode) {
    bullets = [
      ...CONFIRM_BULLETS,
      RELOCK_DESCRIPTION[relockOption] ||
        RELOCK_DESCRIPTION[RELOCK_OPTIONS.RELAUNCH],
      getNotificationConfirmBullet(hideNotification, alertsCount),
      getScheduleNotificationConfirmBullet(
        deleteScheduleNotification,
        scheduledPaymentsCount,
      ),
    ].filter(Boolean);
  } else if (mode === 'notificationInfo') {
    bullets = [
      alertsCount > 0
        ? `This wallet currently has ${alertsCount} notification alert${s(
            alertsCount,
          )}.`
        : 'This wallet currently has no notification alerts.',
      ...infoContent.bullets,
    ];
  } else if (mode === 'scheduleNotificationInfo') {
    bullets = [
      scheduledPaymentsCount > 0
        ? `This wallet currently has ${scheduledPaymentsCount} scheduled payment${s(
            scheduledPaymentsCount,
          )}.`
        : 'This wallet currently has no scheduled payments.',
      ...infoContent.bullets,
    ];
  } else {
    bullets = infoContent.bullets;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancel}
        contentContainerStyle={styles.contentContainer}
        dismissable={!isConfirmMode}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name={isConfirmMode ? 'eye-off-outline' : 'information-outline'}
              size={26}
              color={theme.background}
            />
          </View>
          <Text style={styles.title}>
            {isConfirmMode ? 'Hide this wallet?' : infoContent.title}
          </Text>
          <View style={styles.bulletList}>
            {bullets.map((bullet, index) => (
              <View style={styles.bulletRow} key={index}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.btnList}>
          {!isConfirmMode ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={onCancel}>
              <Text style={styles.primaryBtnText}>Got it</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={onConfirm}>
                <Text style={styles.primaryBtnText}>Got it, hide wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.7}
                onPress={onCancel}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalHideWalletConfirm;
