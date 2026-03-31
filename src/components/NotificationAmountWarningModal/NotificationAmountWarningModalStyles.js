import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.backdrop,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    warningModal: {
      borderRadius: 20,
      margin: 24,
      alignItems: 'center',
    },
    warningIcon: {
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Roboto-Bold',
      color: theme.font,
      marginBottom: 12,
    },
    warningModalText: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 8,
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      width: '100%',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 16,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    modalCancel: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    modalCancelText: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
    },
  });

export default myStyles;
