import React, {useContext} from 'react';
import {Modal, View, Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalDelegationStyles';

const ModalDelegation = ({
  showInfo,
  showConfirm,
  onCloseInfo,
  onCloseConfirm,
  onConfirmRevoke,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <>
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={onCloseInfo}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>EIP-7702 Delegation</Text>
            <Text style={styles.message}>
              {
                'Your wallet has an active EIP-7702 delegation to a smart contract. This enables batch transactions but can cause compatibility issues with some WalletConnect dApps.\n\nRemoving the delegation restores standard wallet behaviour. A small gas fee will apply.'
              }
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={onCloseInfo}>
              <Text style={styles.primaryBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={onCloseConfirm}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Remove Delegation?</Text>
            <Text style={styles.message}>
              {
                'This will submit a transaction to remove the EIP-7702 delegation. A small gas fee will apply.'
              }
            </Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onCloseConfirm}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtnInRow}
                onPress={onConfirmRevoke}>
                <Text style={styles.primaryBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ModalDelegation;
