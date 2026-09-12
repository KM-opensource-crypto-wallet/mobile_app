import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    form: {
      width: '100%',
    },
    title: {
      color: theme.gray,
      fontSize: 18,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      marginBottom: 5,
    },
    box: {
      flexDirection: 'row',
    },
    boxTitle: {
      color: theme.font,
      fontSize: 20,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginBottom: 5,
    },
    boxBalance: {
      color: theme.gray,
      fontSize: 18,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    boxInput: {
      marginTop: 10,
    },
    listTitle: {
      color: theme.font,
      fontSize: 16,
      marginTop: 10,
      marginBottom: 10,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    inputView: {
      backgroundColor: theme.backgroundColor,
      position: 'relative',
      height: 50,
      marginBottom: 5,
    },
    input: {
      height: 50,
      backgroundColor: theme.backgroundColor,
    },
    btnMax: {
      position: 'absolute',
      top: 24,
      right: 16,
      backgroundColor: theme.background,
      width: 40,
      height: 20,
      borderRadius: 5,
      borderColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    btnText: {
      color: theme.backgroundColor,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    scan: {
      backgroundColor: theme.font,
      marginTop: 15,
    },
    textConfirm: {
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    infoText: {
      marginLeft: 10,
      fontSize: 12,
      marginTop: 4,
      color: theme.font,
    },
  });

export default myStyles;
