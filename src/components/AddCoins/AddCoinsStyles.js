import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
    modalView: {
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 10,
      margin: 20,
      paddingTop: 20,
    },

    titleInfo: {
      color: theme.font,
      fontSize: 20,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
      marginBottom: 20,
    },
    btnList: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.gray,
    },
    learnBorder: {
      flex: 1,
      borderRightWidth: 1,
      borderRightColor: theme.gray,
    },
    learnBox: {
      flex: 1,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    learnText: {
      color: theme.background,
      fontSize: 17,
      fontFamily: 'Roboto-Regular',
    },
    errorBox: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: {
      textAlign: 'center',
    },
  });

export default myStyles;
