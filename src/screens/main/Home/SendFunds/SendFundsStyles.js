import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const marginBottomHeight = screenHeight / 10;

const isIpad = screenWidth >= 768;

let inputWidth;
let topMax;
let leftMax;

if (isIpad) {
  inputWidth = screenWidth / 1.15;
  topMax = '50%';
  leftMax = '90%';
} else {
  inputWidth = screenWidth / 1.1;
  topMax = '50%';
  leftMax = '85%';
}

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
    formInput: {
      width: inputWidth,
      flex: 1,
    },
    boxInput: {
      marginTop: 10,
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
      color: theme.backgroundColor,
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
    blockList: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 15,
      width: inputWidth,
    },
    blockTitle: {
      color: theme.font,
      fontSize: 18,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    boxText: {
      color: theme.font,
      fontSize: 18,
      textAlign: 'right',
      fontFamily: 'Roboto-Regular',
    },
    switchList: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 5,
      marginBottom: marginBottomHeight,
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      width: inputWidth,
    },
    switchText: {
      color: theme.font,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
      marginLeft: 10,
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
