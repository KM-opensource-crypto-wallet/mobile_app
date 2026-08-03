import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    safeAreaView: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
    },
    textConfirm: {
      marginTop: -15,
      marginBottom: 20,
      color: theme.error,
      marginLeft: 10,
      fontSize: 12,
    },
    hideWalletHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 8,
    },
    hideWalletLabel: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    infoButton: {
      marginLeft: 8,
    },
    hideToggleError: {
      marginTop: 8,
      color: theme.error,
      fontSize: 12,
    },
    button: {
      marginTop: 20,
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
  });

export default myStyles;
