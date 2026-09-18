import React, {useState, useEffect, useContext} from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  logOutSuccess,
  fingerprintAuthOut,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalResetStyles';
import {resetWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {syncScheduledPaymentNotifications} from 'dok-wallet-blockchain-networks/redux/schedulePayment/schedulePaymentSlice';
import {useDispatch} from 'react-redux';
import {resetCurrentTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {resetBatchTransactions} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import {deleteAlertsForUserThunk} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import googleDrive from '../../utils/googleDriveBackup';
import {logoutOneSignal} from 'utils/onesignal';
import {addBreadcrumb, setUserContext} from 'services/logger';
import {AppBottomSheet, AppButton, AppText, AppTextInput} from 'components/ui';

/**
 * Per-action copy. The typed phrase scales with how destructive the action is:
 * the two flows that wipe the device demand an explicit phrase, while Logout -
 * which only returns to the Login screen - keeps the original 'confirm'.
 */
const PAGE_CONFIG = {
  Forgot: {
    title: 'Reset all wallets?',
    confirmWord: 'RESET ALL WALLETS',
    confirmLabel: 'Reset all wallets',
    body: 'This removes every wallet from this device and starts setup from the beginning. Your funds are safe only if you have your 12/18/24-word seed phrase — without it, they cannot be recovered.',
  },
  'Delete Account': {
    title: 'Delete your account?',
    confirmWord: 'DELETE ACCOUNT',
    confirmLabel: 'Delete account',
    body: 'This removes every wallet and your password from this device. Your funds are safe only if you have your 12/18/24-word seed phrase — without it, they cannot be recovered.',
  },
  Logout: {
    title: 'Log out?',
    confirmWord: 'confirm',
    confirmLabel: 'Log out',
    body: 'You will need your password to get back in. Your wallets stay on this device.',
  },
};

const DEFAULT_CONFIG = PAGE_CONFIG.Logout;

const ModalReset = ({visible, hideModal, navigation, page}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [text, setText] = useState('');
  const dispatch = useDispatch();
  const [list, setList] = useState('');

  useEffect(() => {
    setList(page);
  }, [page]);

  // Reset the typed confirmation whenever the sheet is reopened, so a previous
  // attempt never leaves the destructive button already armed.
  useEffect(() => {
    if (!visible) {
      setText('');
    }
  }, [visible]);

  const config = PAGE_CONFIG[list] || DEFAULT_CONFIG;
  const isArmed =
    text.trim().toLowerCase() === config.confirmWord.toLowerCase();

  const handlerNo = () => {
    if (list === 'Delete Account') {
      hideModal(false);
      navigation.popTo('Sidebar', {
        screen: 'Home',
      });
    } else {
      hideModal(false);
    }
  };

  const handlerYes = async () => {
    if (list === 'Delete Account' || list === 'Forgot') {
      // Remove every notification subscription for this user in one backend
      // call. Fire-and-forget: the thunk reads the master client id from
      // state synchronously (before resetWallet clears it), and account
      // deletion must not be blocked by a network failure.
      dispatch(deleteAlertsForUserThunk());
      addBreadcrumb('wallet', 'reset', {reason: list});
      // The masterClientId is about to be discarded; stop attributing events.
      setUserContext(null);
      dispatch(resetWallet());
      // resetWallet wiped every scheduled payment; cancel every pending
      // reminder that pointed at them.
      await dispatch(syncScheduledPaymentNotifications());
      dispatch(resetCurrentTransferData());
      dispatch(resetBatchTransactions());
      logoutOneSignal();
      await googleDrive.googleSignOut();
      hideModal(false);
      dispatch(logOutSuccess());
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{name: 'CarouselCards'}],
        });
      }, 200);
    } else {
      hideModal(false);
      dispatch(fingerprintAuthOut());
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      dismissable={false}
      onRequestClose={handlerNo}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Icon name="alert-outline" size={26} color={theme.danger} />
        </View>
        <AppText variant="h2" style={styles.title}>
          {config.title}
        </AppText>
      </View>

      <AppText variant="body" tone="muted">
        {config.body}
      </AppText>

      <View>
        <AppText variant="overline" tone="faint" style={styles.label}>
          Type{' '}
          <AppText variant="overline" style={styles.confirmWord}>
            {config.confirmWord}
          </AppText>{' '}
          to confirm
        </AppText>
        <AppTextInput
          surface="solid"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          placeholder={config.confirmWord}
          onChangeText={setText}
          value={text}
          onSubmitEditing={() => {
            if (isArmed) {
              handlerYes();
            }
          }}
        />
      </View>

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          title="Cancel"
          style={styles.cancel}
          onPress={handlerNo}
        />
        <AppButton
          variant="destructive"
          title={config.confirmLabel}
          style={styles.confirm}
          disabled={!isArmed}
          onPress={handlerYes}
        />
      </View>
    </AppBottomSheet>
  );
};

export default ModalReset;
