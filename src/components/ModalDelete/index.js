import React, {useContext, useCallback} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalDeleteStyles';
import {isIpad} from 'utils/dimensions';

// import {getLoading} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 2.5;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalDelete = ({visible, onPressYes, onPressNo, walletName}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const handlerYes = useCallback(() => {
    onPressYes && onPressYes();
  }, [onPressYes]);

  const handlerNo = useCallback(() => {
    onPressNo && onPressNo();
  }, [onPressNo]);

  return (
    <Modal
      visible={visible}
      contentContainerStyle={{
        backgroundColor: theme.secondaryBackgroundColor,
        width: ITEM_WIDTH,
        alignSelf: 'center',
        borderRadius: 10,
        height: modalHeight,
      }}
      dismissable={false}>
      <View style={styles.infoList}>
        <Text style={styles.titleInfo}>{`Delete Wallet: ${walletName}`}</Text>
        <Text style={styles.info}>
          Please make sure you have a copy of 12/18/24-word seed phrase. You
          will need it in order to restore your wallet. Without it you will NOT
          be able to restore your wallet and you will lose access to your funds.
        </Text>
        <Text style={styles.info}>Are you sure you want to proceed?</Text>
      </View>
      <View style={styles.btnList}>
        <View style={styles.learnBorder}>
          <TouchableOpacity style={styles.learnBox} onPress={() => handlerNo()}>
            <Text style={styles.learnText}>No</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.learnBox} onPress={() => handlerYes()}>
          <Text style={styles.learnText}>Yes</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ModalDelete;
