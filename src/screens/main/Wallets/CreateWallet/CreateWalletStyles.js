import {StyleSheet, Dimensions} from 'react-native';

const WIDTH = Dimensions.get('window').width;

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
    },
    formInput: {
      flex: 1,
      paddingTop: 20,
    },
    brand: {
      color: theme.font,
      fontSize: 16,
      marginBottom: 10,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
    },
    textConfirm: {
      marginTop: -15,
      marginBottom: 20,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    info: {
      color: 'red',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 10,
    },
    listTitle: {
      color: theme.font,
      fontSize: 16,
      marginBottom: 10,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    itemSection: {
      marginLeft: 20,
    },
    itemIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemName: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    itemText: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
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
    textWarning: {
      marginBottom: 20,
      color: 'red',
      fontSize: 15,
    },
  });

export default myStyles;
