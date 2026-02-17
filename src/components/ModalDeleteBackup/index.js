import React, {useState, useContext} from 'react';
import {
  Dimensions,
  TouchableOpacity,
  View,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {Modal, Text, TextInput} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalDeleteBackupStyles';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';

const WIDTH = Dimensions.get('window').width + 80;
const isIpad = WIDTH >= 768;

let ITEM_WIDTH;
if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalDeleteBackup = ({visible, hideModal, onConfirm}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [text, setText] = useState('');
  const keyboardHeight = useKeyboardHeight();

  const handlerNo = () => {
    setText('');
    hideModal();
  };

  const handlerYes = async () => {
    setText('');
    hideModal();
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      contentContainerStyle={{
        backgroundColor: theme.secondaryBackgroundColor,
        width: ITEM_WIDTH,
        alignSelf: 'center',
        borderRadius: 10,
        marginBottom: keyboardHeight > 0 ? keyboardHeight / 2 : 0,
      }}
      dismissable={false}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{flexGrow: 1}}
          showsVerticalScrollIndicator={false}>
          <View style={styles.infoList}>
            <Text style={styles.titleInfo}>Delete Backup</Text>
            <Text style={styles.info}>
              This will permanently delete all wallet backups from your Google
              Drive.
            </Text>
            <Text style={styles.info}>
              Your local wallets will NOT be affected. Only the backup files
              stored in Google Drive will be deleted.
            </Text>
            <Text style={styles.info}>
              This action cannot be undone. Type "confirm" to proceed.
            </Text>
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
              placeholder={'Confirm'}
              placeholderTextColor={theme.placeholderColor}
              onSubmitEditing={() => {
                if (text.toLowerCase() === 'confirm') {
                  handlerYes();
                }
              }}
            />
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
              style={[
                styles.learnBox,
                text.toLowerCase() !== 'confirm' && {opacity: 0.5},
              ]}
              onPress={() => handlerYes()}
              disabled={text.toLowerCase() !== 'confirm'}>
              <Text style={styles.learnText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ModalDeleteBackup;
