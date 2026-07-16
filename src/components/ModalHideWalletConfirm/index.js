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
  "The code is case-insensitive, so it doesn't matter how you type it.",
  'To bring a hidden wallet back, search its exact secret code on the Wallets screen. Partial matches do not reveal it.',
  'Choose how it re-hides itself: on app relaunch (default), as soon as the app is backgrounded, or only when you manually turn this switch off.',
  'Hidden wallets are skipped when you back up to Google Drive. Unhide a wallet first if you want it included in your backup.',
];

const CONFIRM_BULLETS = [
  'This wallet will disappear from the Wallets list and every screen that shows wallets, including Address Book, Swap and Send/Receive.',
  'The only way to bring it back is to search its exact secret code on the Wallets screen.',
  "The code is case-insensitive, so it doesn't matter how you typed it.",
];

const NOTIFICATION_INFO_BULLETS = [
  'This controls whether a hidden wallet can still send you push notifications for its alerts (price/transfer alerts, etc).',
  'Enabled (default): notifications for this wallet are suppressed while it stays hidden, so nothing on your lock screen or notification tray reveals its activity.',
  "Disabled: you'll keep receiving notifications for this wallet's alerts even while it's hidden.",
];

const INFO_CONTENT = {
  info: {title: 'About Hide Wallet', bullets: INFO_BULLETS},
  notificationInfo: {
    title: 'About Hide Notifications',
    bullets: NOTIFICATION_INFO_BULLETS,
  },
};

const ModalHideWalletConfirm = ({
  visible,
  mode = 'confirm',
  relockOption,
  onConfirm,
  onCancel,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const isConfirmMode = mode === 'confirm';
  const infoContent = INFO_CONTENT[mode] || INFO_CONTENT.info;
  const bullets = isConfirmMode
    ? [
        ...CONFIRM_BULLETS,
        RELOCK_DESCRIPTION[relockOption] ||
          RELOCK_DESCRIPTION[RELOCK_OPTIONS.RELAUNCH],
      ]
    : infoContent.bullets;

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
