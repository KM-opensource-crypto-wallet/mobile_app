import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
    },
    errorText: {
      color: theme.error,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 10,
    },
    addressView: {
      marginTop: 14,
    },
    input: {
      marginTop: 14,
      backgroundColor: theme.backgroundColor,
      color: theme.font,
    },
    addCoinText: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 14,
    },
    addCoinLink: {
      color: theme.background,
      fontFamily: 'Roboto-Bold',
    },
    detailsCard: {
      backgroundColor: theme.lightBackground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginTop: 14,
    },
    boxFooter: {
      marginTop: 20,
    },
    textStyle: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
    },
    warningText: {
      color: theme.warning,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 10,
    },
    buttonHintError: {
      color: theme.error,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 10,
    },
    buttonHintInfo: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 10,
    },
    button: {
      marginTop: 16,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    buttonDisabled: {
      backgroundColor: theme.disabledButton,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Bold',
    },
  });

export default myStyles;
