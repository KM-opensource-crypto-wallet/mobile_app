import {StyleSheet, Dimensions} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const marginBottomHeight = screenHeight / 10;

const isIpad = screenWidth >= 768;

let inputWidth;
let topMax;
let leftMax;

if (isIpad) {
  inputWidth = screenWidth / 1.15;
  topMax = '42%';
  leftMax = '90%';
} else {
  inputWidth = screenWidth / 1.1;
  topMax = '46%';
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
      height: 140,
    },
    input: {
      marginBottom: 5,
      backgroundColor: theme.backgroundColor,
      position: 'relative',
    },
    btnMax: {
      position: 'absolute',
      top: topMax,
      left: leftMax,
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
    },
    textConfirm: {
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    nftMainView: {
      flex: 1,
      alignItems: 'center',
    },
    imageStyle: {
      height: 120,
      width: 120,
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
    nftTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginTop: 16,
    },
    nftSubTitle: {
      color: theme.primary,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    description: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 16,
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
      textTransform: 'uppercase',
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
