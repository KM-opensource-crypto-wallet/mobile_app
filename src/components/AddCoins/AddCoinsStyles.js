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
      padding: 20,
      rowGap: 20,
    },
    infoList: {
      rowGap: 10,
    },
    coinList: {
      marginHorizontal: -15,
    },
    titleInfo: {
      color: theme.font,
      fontSize: 20,
      fontFamily: 'Roboto-Regular',
    },
    btnList: {
      columnGap: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopColor: theme.gray,
    },
    button: {
      flex: 1,
      height: 60,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
    },
    errorBox: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: {
      color: theme.font,
      textAlign: 'center',
    },
  });

export default myStyles;
