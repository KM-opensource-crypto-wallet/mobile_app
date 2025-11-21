import React, {useContext, useCallback} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalConfirmEnableChatModalStyles';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalConfirm = ({
  visible,
  onPressYes,
  onPressNo,
  title,
  description,
  noButtonTitle,
  yesButtonTitle,
}) => {
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
          paddingVertical: 16,
        }}
        dismissable={false}>
        <View style={styles.infoList}>
          <Text style={styles.titleInfo}>{title}</Text>
          <Text style={styles.info}>{description}</Text>
        </View>
        <View style={styles.btnList}>
          <View style={styles.learnBorder}>
            <TouchableOpacity
              style={styles.learnBox}
              onPress={() => handlerNo()}>
              <Text style={styles.learnText}>{noButtonTitle || 'No'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.learnBox}
            onPress={() => handlerYes()}>
            <Text style={styles.learnText}>{yesButtonTitle || 'Yes'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalConfirm;
