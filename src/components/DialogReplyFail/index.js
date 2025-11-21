import React from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import myStyles from './DialogReplyFail';
import {Modal} from 'react-native-paper';
import {useContext} from 'react';
import {ThemeContext} from 'theme/ThemeContext';

const DialogReplyFail = ({visible, hideDialog, message}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const containerStyle = {
    backgroundColor: theme.backgroundColor,
    justifyContent: 'flex-start',
    borderRadius: 20,
  };

  return (
    <Modal
      visible={visible}
      contentContainerStyle={containerStyle}
      accessibilityLabel="Error Dialog"
      accessibilityRole="alert"
      onDismiss={() => hideDialog(false)}>
      <View style={styles.modalView}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Error</Text>
        </View>
        <Text style={styles.modalText}>{message}</Text>
        <TouchableOpacity
          onPress={() => {
            hideDialog(false);
          }}>
          <Text style={styles.button}>Okay</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default DialogReplyFail;
