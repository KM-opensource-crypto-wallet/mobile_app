import React, {useState, useEffect, useContext} from 'react';
import {Text, View, TouchableOpacity, Dimensions} from 'react-native';
import {Modal} from 'react-native-paper';
import myStyles from './ModaSendStyles';
import {useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const ModalSend = ({visible, hideModal, navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  // const handleClose = () => {
  //   hideModal(false);
  // };
  const currentCoin = useSelector(selectCurrentCoin);

  const containerStyle = {
    backgroundColor: theme.secondaryBackgroundColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: HEIGHT / 2.5,
    alignSelf: 'center',
    width: WIDTH,
  };

  return (
    <Modal
      animationType="slide"
      // dismissable={false}
      onDismiss={() => {
        hideModal(false);
      }}
      visible={visible}
      contentContainerStyle={containerStyle}
      style={styles.modal}>
      <View style={styles.list}>
        <Text style={styles.listTitle}>You Need {currentCoin?.name}</Text>
        <Text style={styles.listText}>
          In order to send funds, you need to have {currentCoin?.name}.
        </Text>
        {/* </View> */}
        <View style={styles.listbtn}>
          <TouchableOpacity
            style={{...styles.button, ...styles.shadow}}
            onPress={() =>
              navigation.navigate('Sidebar', {
                screen: 'BuyCrypto',
              })
            }>
            <Text style={styles.btnBuy}>Buy {currentCoin?.name}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{...styles.button, ...styles.shadow}}
            // onPress={() => {
            //   console.log('click:', 'click');
            // }}
            // onPress={() => navigation.navigate('Exchange')}>
            onPress={() =>
              navigation.navigate('Sidebar', {
                screen: 'Exchange',
              })
            }>
            <Text style={styles.btnEx}>Exchange</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalSend;
