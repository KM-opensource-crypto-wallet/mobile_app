import { StyleSheet, Dimensions } from 'react-native';
import { SCREEN_WIDTH } from '../../../../utils/dimensions';

// const {width: screenWidth} = Dimensions.get('window');
// const inputWidth = screenWidth / 1.1;

const { width: screenWidth } = Dimensions.get('window');

const isIpad = screenWidth >= 768;

let itemWidth;

if (isIpad) {
  itemWidth = screenWidth / 1.15;
} else {
  itemWidth = screenWidth / 1.1;
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
    },
    contentContainer: {
      flexGrow: 1,
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
      fontSize: 17,
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
      marginBottom: 20,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    keyboardOverView: {
      bottom: -100,
      width: SCREEN_WIDTH,
      height: 50,
      position: 'absolute',
      zIndex: 9999,
      backgroundColor: theme.walletItemColor,
    },
    itemView: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.gray,
      backgroundColor: theme.backgroundColor,
    },
    wordText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
  });

export default myStyles;
