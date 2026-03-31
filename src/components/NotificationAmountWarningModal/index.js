import React, {memo, useContext} from 'react';
import {View, Text, Modal, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './NotificationAmountWarningModalStyles';

const NotificationAmountWarningModal = ({visible, onConfirm, onDismiss}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, styles.warningModal]}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={36}
            color="#ff9800"
            style={styles.warningIcon}
          />
          <Text style={styles.modalTitle}>Low Minimum Amount</Text>
          <Text style={styles.warningModalText}>
            One or more coins have a minimum amount below $10. You may receive
            very few alerts. Continue anyway?
          </Text>
          <TouchableOpacity style={styles.button} onPress={onConfirm}>
            <Text style={styles.buttonTitle}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCancel} onPress={onDismiss}>
            <Text style={styles.modalCancelText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default memo(NotificationAmountWarningModal);
