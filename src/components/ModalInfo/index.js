import React, {useCallback, useContext, useState} from 'react';
import {
  Dimensions,
  TouchableOpacity,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {Modal, Portal, Text, TextInput} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalInfoStyles';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';

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
  showTextInput,
  confirmWord = 'confirm',
  confirmPrompt,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [text, setText] = useState('');
  const normalizedText = text.trim().toLowerCase();
  const normalizedConfirm = confirmWord.toLowerCase();
  const isDisabled = normalizedText !== normalizedConfirm;
  const keyboardHeight = useKeyboardHeight();

  const handlerConfirm = useCallback(() => {
    if (showTextInput && !isDisabled) {
      handleClose();
    } else {
      handleClose();
    }
  }, [handleClose, isDisabled, showTextInput]);

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
          marginBottom: keyboardHeight > 0 ? keyboardHeight / 2 : 0,
        }}
        dismissable={false}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1}}
            showsVerticalScrollIndicator={false}>
            <View style={styles.infoList}>
              <Text style={styles.titleInfo}>{title}</Text>
              <Text style={styles.info}>{message}</Text>
            </View>

            {showTextInput && (
              <>
                <Text style={styles.info}>{'Write confirm to continue.'}</Text>
                <View style={{paddingHorizontal: 10}}>
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
                  showTextInput && isDisabled && {opacity: 0.5},
                ]}
                disabled={showTextInput && isDisabled}
                onPress={handlerConfirm}>
                <Text style={styles.learnText}>{confirmPrompt || 'Okay'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </Modal>
    </Portal>
  );
};

export default ModalInfo;
