import React, {useState, useEffect, useContext} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text, Provider} from 'react-native-paper';
import myStyles from './ModalExchangeStyles';
import {ThemeContext} from 'theme/ThemeContext';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 2.5;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalExchange = ({visible, hideModal, navigation, reset}) => {
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
    <Modal
      visible={visible}
      contentContainerStyle={containerStyle}
      onDismiss={() => hideModal(false)}>
      <View style={styles.infoList}>
        <Text style={styles.titleInfo}>Available amount</Text>
        <Text style={styles.info}>
          The available amount you can convert is your balance less a small
          amount that will be used as gas fees for the conversion.
        </Text>
        <TouchableOpacity
          style={{...styles.button, ...styles.shadow}}
          onPress={() => {
            hideModal(false);
            reset();
            navigation.navigate('BuyCrypto');
          }}>
          <Text style={styles.btnEx}>OK</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ModalExchange;
