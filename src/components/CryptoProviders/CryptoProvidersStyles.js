import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');

const isIpad = screenWidth >= 768;

let itemWidth;
let marginIcon;

if (isIpad) {
  marginIcon = 50;
} else {
  itemWidth = screenWidth / 1.4;
  marginIcon = 10;
}

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingVertical: 24,
      backgroundColor: theme.backgroundColor,
    },
    addView: {
      marginTop: 20,
    },
    rowView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectTitle: {
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      color: theme.font,
    },
    description: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      color: theme.gray,
      marginTop: 8,
    },
    paddingView: {
      height: 16,
      width: '100%',
    },
    input: {
      marginTop: 20,
      fontWeight: '700',
      fontSize: 32,
      height: 70,
      flex: 1,
      marginLeft: 8,
      backgroundColor: theme.backgroundColor,
    },
    textConfirm: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
      fontWeight: '600',
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      marginTop: 24,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    btn: {
      backgroundColor: theme.backgroundColor,
      height: 60,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderColor: theme.gray,
      // borderRadius: 50,
    },
    btnBox: {
      flex: 1,
      paddingRight: 20,
    },
    btnTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    btnCoins: {
      color: theme.background,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginTop: 4,
    },
    imageBox: {
      width: 40,
      height: 40,
      color: theme.backgroundColor,
      // borderRadius: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    image: {
      width: 35,
      height: 35,
      borderRadius: 20,
      borderColor: theme.borderActiveColor,
      borderWidth: 1,
    },
    ////////////////////////
    list: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 0.5,
      borderBottomColor: theme.gray,
    },
    iconBox: {
      width: 39,
      height: 39,
      backgroundColor: theme.font,
      borderRadius: 20,
      marginLeft: marginIcon,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginTop: 10,
      marginBottom: 10,
    },
    items: {
      alignItems: 'flex-start',
      width: itemWidth,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 10,
    },
    title: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    text: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginBottom: 10,
    },
    addCoinText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 15,
      color: theme.gray,
      marginBottom: 2,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default myStyles;
