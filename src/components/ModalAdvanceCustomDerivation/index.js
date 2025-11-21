import React, {useContext, useCallback} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalAdvanceCustomDerivationStyles';

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

const ModalAdvanceCustomDerivation = ({visible, onPressYes, onPressNo}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const handlerNo = useCallback(() => {
    onPressNo?.();
  }, [onPressNo]);

  const handlerYes = useCallback(() => {
    onPressYes?.();
  }, [onPressYes]);

  return (
    <Portal>
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
          <Text style={styles.titleInfo}>{'Attention!'}</Text>
          <Text style={styles.info}>
            {
              'The “Custom Derivation” feature is an advanced option. It’s important to ensure you have a solid understanding of derivations before proceeding.\n Would you like to continue?'
            }
          </Text>
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
            style={styles.learnBox}
            onPress={() => handlerYes()}>
            <Text style={styles.learnText}>Yes</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalAdvanceCustomDerivation;
