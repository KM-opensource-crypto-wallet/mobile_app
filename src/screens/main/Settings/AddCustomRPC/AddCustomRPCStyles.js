import {StyleSheet, Dimensions} from 'react-native';

// const {width: screenWidth} = Dimensions.get('window');
// const inputWidth = screenWidth / 1.1;

const {width: screenWidth} = Dimensions.get('window');

const isIpad = screenWidth >= 768;

let itemWidth;

if (isIpad) {
  itemWidth = screenWidth / 1.15;
} else {
  itemWidth = screenWidth / 1.1;
}

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
    },
    title: {
      color: theme.font,
      fontSize: 28,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    formBox: {
      justifyContent: 'flex-end',
    },
    formInput: {
      width: itemWidth,
      marginTop: 10,
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
      height: 50,
    },
    scan: {
      backgroundColor: theme.font,
    },
    textConfirm: {
      marginTop: -15,
      marginBottom: 20,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    info: {
      width: itemWidth - 60,
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 10,
      textAlign: 'center',
      alignSelf: 'center',
    },
    listTitle: {
      color: theme.gray,
      fontSize: 14,
      marginTop: 10,
      marginBottom: 10,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    contentContainerStyle: {
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    checkboxView: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    checkboxDesc: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.gray,
    },
  });

export default myStyles;
