import React, {useContext, useCallback} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalConfirmEnableChatModalStyles';
import {WL_APP_NAME} from 'utils/wlData';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalConfirmEnableChatModal = ({visible, onPressYes, onPressNo}) => {
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
          <Text style={styles.titleInfo}>{'Attention!'}</Text>
          <Text style={styles.info}>
            {'Please be aware that hackers, fraudsters, and spammers can send you external links which, if clicked, can drain your wallet.\n' +
              `Only use this chat if you are confident in your ability to manage these risks. The chat service is provided by xmtp.org, and ${WL_APP_NAME} is not responsible for it and cannot assist you if something goes wrong.
` +
              `${WL_APP_NAME} cannot compensate for any loss of assets. Use the chat only if you understand and accept these risks, and acknowledge that ${WL_APP_NAME} has no responsibility whatsoever.
 Are you sure you want to continue?
`}
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

export default ModalConfirmEnableChatModal;
