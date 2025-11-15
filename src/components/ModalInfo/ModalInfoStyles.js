import {StyleSheet, Dimensions} from 'react-native';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;
let ITEM_PAD;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
  ITEM_PAD = 20;
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
  ITEM_PAD = 10;
}

const myStyles = theme =>
  StyleSheet.create({
    infoList: {
      padding: ITEM_PAD,
      width: ITEM_WIDTH,
      display: 'flex',
      justifyContent: 'center',

      alignItems: 'center',
    },
    titleInfo: {
      color: theme.font,
      fontSize: 20,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
      marginBottom: 20,
      textTransform: 'uppercase',
    },
    info: {
      color: theme.font,
      fontSize: 16,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
    },
    // btnList: {
    //   flexDirection: 'row',
    //   alignItems: 'center',
    //   borderTopWidth: 1,
    //   borderTopColor: theme.gray,
    // },
    // learnBorder: {
    //   borderRightWidth: 1,
    //   borderRightColor: theme.gray,
    // },
    inputStyle: {
      borderWidth: 1,
      height: 44,
      maxHeight: 44,
      borderColor: theme.headerBorder,
      width: '100%',
      color: theme.font,
      borderRadius: 8,
      paddingHorizontal: 10,
      marginVertical: 8,
    },
    learnBox: {
      width: ITEM_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
      height: 60,
    },
    learnText: {
      color: theme.background,
      fontSize: 17,
      fontFamily: 'Roboto-Regular',
    },
    //
    btnList: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginTop: 20,
    },

    button: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      marginHorizontal: 6, // space between No and Yes
    },

    learnBorder: {
      borderWidth: 1.5,
      borderColor: '#000',
      borderRadius: 10,
      paddingVertical: 12,
    },
  });

export default myStyles;
