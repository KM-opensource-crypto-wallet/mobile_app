import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');

const isIpad = screenWidth >= 768;

let inputWidth;

if (isIpad) {
  inputWidth = screenWidth / 1.15;
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
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
    },
    formInput: {
      width: inputWidth,
      flex: 1,
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
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
    },
    textConfirm: {
      marginTop: -15,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    textWarning: {
      marginBottom: 20,
      color: 'red',
      fontSize: 15,
    },
  });

export default myStyles;
