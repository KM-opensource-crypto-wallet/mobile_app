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

const ModalInfo = ({
  visible,
  handleClose,
  title,
  message,
  requireConfirm = false,
  confirmWord = 'confirm',
  confirmPrompt,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [text, setText] = useState('');
  const normalizedText = text.trim().toLowerCase();
  const normalizedConfirm = confirmWord.toLowerCase();
  const isDisabled = requireConfirm && normalizedText !== normalizedConfirm;

  const handlerConfirm = useCallback(() => {
    if (!requireConfirm || !isDisabled) {
      handleClose();
    }
  }, [handleClose, isDisabled, requireConfirm]);
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
        {requireConfirm && (
          <>
            <Text style={styles.info}>
              {confirmPrompt || 'Write confirm to delete all wallets.'}
            </Text>
            <View style={{paddingHorizontal: 10}}>
              <TextInput
                mode="flat"
                style={[
                  styles.inputStyle,
                  {backgroundColor: theme.secondaryBackgroundColor},
                ]}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                onChangeText={setText}
                value={text}
                placeholder={confirmWord}
                placeholderTextColor={theme.placeholderColor}
              />
            </View>
          </>
        )}
        <View style={styles.btnList}>
          <TouchableOpacity
            style={[
              styles.learnBorder,
              styles.button,
              requireConfirm && isDisabled && {opacity: 0.5},
            ]}
            disabled={isDisabled}
            onPress={handlerConfirm}>
            <Text style={styles.learnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalInfo;
