import React, {useCallback, useContext, useState} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text, TextInput} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalInfoStyles';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalInfo = ({visible, handleClose, title, message}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [text, setText] = useState('');
  const handlerConfirm = useCallback(() => {
    if (text.toLowerCase() === 'confirm') {
      handleClose();
    }
  }, [handleClose, text]);
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
          <Text style={styles.titleInfo}>{title}</Text>
          <Text style={styles.info}>{message}</Text>
        </View>
        <Text style={styles.info}>Write confirm to delete all wallets.</Text>
        <View style={{paddingHorizontal: 20}}>
          <TextInput
            style={styles.inputStyle}
            onChangeText={setText}
            value={text}
            placeholder={'Confirm'}
            placeholderTextColor={theme.placeholderColor}
          />
        </View>
        <View style={styles.btnList}>
          {/* <TouchableOpacity
            style={[styles.learnBorder, styles.button]}
            // onPress={() => handlerNo()}
          >
            <Text style={styles.learnText}>Close</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[
              styles.learnBorder,
              styles.button,
              text.toLowerCase() !== 'confirm' && {opacity: 0.5},
            ]}
            disabled={text.toLowerCase() !== 'confirm'}
            onPress={handlerConfirm}>
            <Text style={styles.learnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalInfo;
