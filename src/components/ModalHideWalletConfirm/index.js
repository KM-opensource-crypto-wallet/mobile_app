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
];

const CONFIRM_BULLETS = [
  'This wallet will disappear from the Wallets list and every screen that shows wallets, including Address Book, Swap and Send/Receive.',
  'The only way to bring it back is to search its exact secret code on the Wallets screen.',
  "The code is case-insensitive, so it doesn't matter how you typed it.",
];

const ModalHideWalletConfirm = ({
  visible,
  mode = 'confirm',
  relockOption,
  onConfirm,
  onCancel,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const isInfoMode = mode === 'info';
  const bullets = isInfoMode
    ? INFO_BULLETS
    : [
        ...CONFIRM_BULLETS,
        RELOCK_DESCRIPTION[relockOption] ||
          RELOCK_DESCRIPTION[RELOCK_OPTIONS.RELAUNCH],
      ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancel}
        contentContainerStyle={styles.contentContainer}
        dismissable={isInfoMode}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name={isInfoMode ? 'information-outline' : 'eye-off-outline'}
              size={26}
              color={theme.background}
            />
          </View>
          <Text style={styles.title}>
            {isInfoMode ? 'About Hide Wallet' : 'Hide this wallet?'}
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
          {isInfoMode ? (
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
