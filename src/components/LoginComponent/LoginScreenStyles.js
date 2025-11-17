import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');

const isIpad = screenWidth >= 768;

let inputWidth;

if (isIpad) {
  inputWidth = screenWidth / 2;
} else {
  inputWidth = screenWidth / 1.1;
}

const myStyles = theme =>
  StyleSheet.create({
    safeAreaView: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    formInput: {
      width: inputWidth,
      marginTop: 16,
    },
    brand: {
      color: theme.font,
      fontSize: 16,
      marginBottom: 10,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    image: {
      marginBottom: 10,
    },
    title: {
      color: theme.font,
      fontSize: 30,
      marginVertical: 16,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    textConfirm: {
      marginTop: -15,
      marginBottom: 10,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    textWarning: {
      marginBottom: 10,
      color: 'red',
      fontSize: 15,
    },
    reset: {
      marginTop: 10,
      alignItems: 'center',
    },
    resetTitle: {
      color: theme.font,
      fontSize: 16,
      marginBottom: 5,
      fontFamily: 'Roboto-Regular',
    },
    resetText: {
      color: theme.background,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      width: 230,
      textAlign: 'center',
    },
  });

export default myStyles;
