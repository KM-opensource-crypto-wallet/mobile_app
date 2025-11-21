import React, {useContext} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import myStyles from './ModalFingerprintStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {getFingerprintName} from 'dok-wallet-blockchain-networks/helper';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 3;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalFingerprint = ({visible, hideModal, fingerprintEnabled}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const containerStyle = {
    backgroundColor: theme.secondaryBackgroundColor,
    width: ITEM_WIDTH,
    alignSelf: 'center',
    borderRadius: 10,
    height: modalHeight,
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={containerStyle}
        dismissable={false}>
        <View style={styles.infoList}>
          <Text style={styles.titleInfo}>{`${getFingerprintName(
            fingerprintEnabled,
          )} is not added`}</Text>

          <Text style={styles.info}>
            {`Your ${getFingerprintName(
              fingerprintEnabled,
            )} is not registered on device.`}
          </Text>
          <Text style={styles.info}>
            {`Please register your ${getFingerprintName(
              fingerprintEnabled,
            )} by going into your device settings.`}
          </Text>
        </View>

        <View style={styles.buttonList}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              hideModal(false);
            }}>
            <Text style={styles.buttonTitle}>Ok</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalFingerprint;
