import React, {useContext} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalConfirmEnableChatModalStyles';
import {currencySymbol} from 'data/currency';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalCancelPendingTransactions = ({
  visible,
  onPressYes,
  onPressNo,
  pendingTransferData,
  currentCoin,
  localCurrency,
  isCancelTransaction,
}) => {
  const {isLoading, fiatEstimateFee, transactionFee, success} =
    pendingTransferData;

  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={{
          backgroundColor: theme.secondaryBackgroundColor,
          width: ITEM_WIDTH,
          alignSelf: 'center',
          borderRadius: 10,
          paddingVertical: 16,
        }}
        dismissable={false}>
        <View style={styles.infoList}>
          <Text style={styles.titleInfo}>{`${
            isCancelTransaction ? 'Cancel' : 'Speed Up'
          } Transaction?`}</Text>
          <Text style={styles.info}>
            {`Are you sure you want to ${
              isCancelTransaction ? 'cancel' : 'speed up'
            } the pending transaction? Please note that a fee may apply.`}
          </Text>
          <View style={styles.paddingView}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.background} />
            ) : success ? (
              <View>
                <Text style={styles.feeTitle}>{'Estimate Fees:'}</Text>
                <Text
                  style={
                    styles.feeDescription
                  }>{`${transactionFee} ${currentCoin?.chain_symbol}`}</Text>
                <Text style={styles.feeDescription}>
                  {currencySymbol[localCurrency] + fiatEstimateFee}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.btnList}>
          <View style={styles.learnBorder}>
            <TouchableOpacity style={styles.learnBox} onPress={onPressNo}>
              <Text style={styles.learnText}>No</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.learnBox} onPress={onPressYes}>
            <Text style={styles.learnText}>Yes</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalCancelPendingTransactions;
