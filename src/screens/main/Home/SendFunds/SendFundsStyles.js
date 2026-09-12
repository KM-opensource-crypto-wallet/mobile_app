import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');
const isIpad = screenWidth >= 768;
const inputWidth = isIpad ? screenWidth / 1.15 : screenWidth / 1.1;

// Shared form field styles live in components/SendFundsForm/SendFundsFormStyles.
const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
    },
    contentContainerStyle: {
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    formInput: {
      width: inputWidth,
      flex: 1,
    },
    button: {
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      width: inputWidth,
      marginBottom: 20,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
    },
  });

export default myStyles;
