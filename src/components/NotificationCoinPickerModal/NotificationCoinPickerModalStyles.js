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
      paddingTop: 24,
      paddingBottom: 36,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Roboto-Bold',
      color: theme.font,
      marginBottom: 12,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
    },
    modalOptionActive: {
      backgroundColor: theme.secondaryBackgroundColor,
    },
    flexOne: {
      flex: 1,
    },
    coinSymbol: {
      fontSize: 16,
      color: theme.font,
      fontFamily: 'Roboto-Bold',
    },
    coinName: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    modalCancel: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    modalCancelText: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
    },
  });

export default myStyles;
