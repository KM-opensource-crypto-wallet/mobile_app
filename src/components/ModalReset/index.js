import React, {useState, useEffect, useContext} from 'react';
import {
  Dimensions,
  TouchableOpacity,
  View,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {Modal, Text, TextInput} from 'react-native-paper';
import {
  logOutSuccess,
  fingerprintAuthOut,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalResetStyles';
import {resetWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {selectAllScheduledPayments} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {useDispatch, useSelector} from 'react-redux';
import {resetCurrentTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {resetBatchTransactions} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import {deleteAlertsForUserThunk} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import googleDrive from '../../utils/googleDriveBackup';
import {logoutOneSignal} from 'utils/onesignal';
import {useLocalNotification} from 'providers/hooks/useLocalNotification';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalReset = ({visible, hideModal, navigation, page}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [text, setText] = useState('');
  const dispatch = useDispatch();
  const [list, setList] = useState('');
  const keyboardHeight = useKeyboardHeight();
  const allScheduledPayments = useSelector(selectAllScheduledPayments);
  const {cancelScheduledPaymentNotifications} = useLocalNotification();

  useEffect(() => {
    setList(page);
  }, [page]);

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
      // Cancel every pending scheduled-payment reminder before resetWallet
      // wipes the data (recipient/amount/wallet) those notifications point to.
      await cancelScheduledPaymentNotifications(
        allScheduledPayments.map(payment => payment?.id),
      );
      dispatch(resetWallet());
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
    <Modal
      visible={visible}
      contentContainerStyle={{
        backgroundColor: theme.secondaryBackgroundColor,
        width: ITEM_WIDTH,
        alignSelf: 'center',
        borderRadius: 10,
        marginBottom: keyboardHeight > 0 ? keyboardHeight / 2 : 0,
      }}
      dismissable={false}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{flexGrow: 1}}
          showsVerticalScrollIndicator={false}>
          <View style={styles.infoList}>
            <Text style={styles.titleInfo}>{page}</Text>
            <Text style={styles.info}>
              It will delete all wallets and password. Please make sure you have
              a copy of 12/18/24-word seed phrase. You will need it in order to
              restore your wallet. Without it you will NOT be able to restore
              your wallet and you will lose access to your funds.
            </Text>
            <Text style={styles.info}>
              Write confirm to delete all wallets.
            </Text>
            <TextInput
              style={styles.inputStyle}
              textColor={theme.font}
              theme={{
                colors: {
                  onSurfaceVariant: theme.gray,
                },
              }}
              outlineColor={theme.gray}
              activeOutlineColor={theme.font}
              autoCapitalize="none"
              returnKeyType="done"
              mode="outlined"
              onChangeText={setText}
              value={text}
              placeholder={'Confirm'}
              placeholderTextColor={theme.placeholderColor}
              onSubmitEditing={() => {
                if (text.toLowerCase() === 'confirm') {
                  handlerYes();
                }
              }}
            />
          </View>

          <View style={styles.btnList}>
            <View style={styles.learnBorder}>
              <TouchableOpacity
                style={styles.learnBox}
                onPress={() => handlerNo()}>
                <Text style={styles.learnText}>No</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.learnBox,
                text.toLowerCase() !== 'confirm' && {opacity: 0.5},
              ]}
              onPress={() => handlerYes()}
              disabled={text.toLowerCase() !== 'confirm'}>
              <Text style={styles.learnText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ModalReset;
