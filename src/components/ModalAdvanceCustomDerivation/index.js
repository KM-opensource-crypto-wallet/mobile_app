import React, {useContext, useCallback} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalAdvanceCustomDerivationStyles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {updateCustomDerivedChecked} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {useDispatch} from 'react-redux';

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

const ModalAdvanceCustomDerivation = ({
  isChecked,
  visible,
  onPressYes,
  onPressNo,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  const handlerNo = useCallback(() => {
    dispatch(updateCustomDerivedChecked(false));
    onPressNo?.();
  }, [dispatch, onPressNo]);

  const handlerYes = useCallback(() => {
    onPressYes?.();
  }, [onPressYes]);

  const handleCheckBox = useCallback(() => {
    dispatch(updateCustomDerivedChecked(!isChecked));
  }, [dispatch, isChecked]);

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
        <TouchableOpacity onPress={handleCheckBox}>
          <View style={styles.checkboxAndText}>
            <MaterialCommunityIcons
              name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={isChecked ? theme.background : theme.gray}
            />
            <Text style={[{}, styles.info]}>Don't show this popup again</Text>
          </View>
        </TouchableOpacity>
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
