import React, {useContext} from 'react';
import {Dimensions, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 1.6;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.75);
}

const DuplicateTransactionModal = ({visible, onClose}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={styles.modalContainer}
        dismissable={false}>
        <View style={styles.infoList}>
          <View style={styles.iconContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
          </View>
          <Text style={styles.titleInfo}>Duplicate Transaction Detected</Text>
          <View style={styles.messageContainer}>
            <Text style={styles.info}>
              You are attempting to repeat a transaction that may have already
              been processed.
            </Text>
            <Text style={styles.infoHighlight}>
              Please check the block explorer before continuing to avoid
              duplicate transactions.
            </Text>
            <Text style={styles.recommendation}>Recommendations:</Text>
            <Text style={styles.bulletPoint}>
              • Check your transaction history
            </Text>
            <Text style={styles.bulletPoint}>• Verify on block explorer</Text>
            <Text style={styles.bulletPoint}>
              • Wait for confirmation before retrying
            </Text>
          </View>
        </View>

        <View style={styles.btnList}>
          <TouchableOpacity style={styles.learnBox} onPress={onClose}>
            <Text style={styles.learnText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.secondaryBackgroundColor,
      width: ITEM_WIDTH,
      alignSelf: 'center',
      borderRadius: 15,
      height: modalHeight,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    infoList: {
      padding: isIpad ? 30 : 25,
      width: ITEM_WIDTH,
      height: modalHeight - 80,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      marginBottom: 15,
      alignItems: 'center',
    },
    warningIcon: {
      fontSize: 48,
      textAlign: 'center',
    },
    titleInfo: {
      color: theme.font,
      fontSize: 22,
      textAlign: 'center',
      fontFamily: 'Roboto-Bold',
      marginBottom: 8,
      fontWeight: 'bold',
    },
    subtitle: {
      color: theme.font,
      fontSize: 14,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
      marginBottom: 20,
      opacity: 0.7,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    messageContainer: {
      width: '100%',
      paddingHorizontal: 5,
      flex: 1,
    },
    info: {
      color: theme.font,
      fontSize: 15,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
      marginBottom: 15,
      lineHeight: 22,
      paddingHorizontal: 5,
    },
    infoHighlight: {
      color: '#FF6B6B',
      fontSize: 15,
      textAlign: 'center',
      fontFamily: 'Roboto-Medium',
      marginBottom: 20,
      lineHeight: 22,
      fontWeight: '500',
      paddingHorizontal: 5,
    },
    recommendation: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      marginBottom: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    bulletPoint: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginBottom: 8,
      textAlign: 'left',
      paddingLeft: 15,
      lineHeight: 20,
      paddingRight: 15,
    },
    btnList: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.gray,
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
      overflow: 'hidden',
    },
    learnBox: {
      width: ITEM_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
      height: 80,
      backgroundColor: theme.primaryColor || '#007AFF',
    },
    learnText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
  });

export default DuplicateTransactionModal;
