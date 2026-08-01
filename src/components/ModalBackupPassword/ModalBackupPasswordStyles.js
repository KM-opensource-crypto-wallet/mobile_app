import {StyleSheet, Dimensions, Platform} from 'react-native';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;
let ITEM_PAD;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
  ITEM_PAD = 30;
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
  ITEM_PAD = 20;
}

const myStyles = theme =>
  StyleSheet.create({
    infoList: {
      padding: ITEM_PAD,
      width: ITEM_WIDTH,
      alignItems: 'center',
    },
    infoHeader: {
      flexDirection: 'row',
    },
    titleInfo: {
      flex: 1,
      color: theme.font,
      fontSize: 20,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    infoIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      width: '100%',
      backgroundColor: theme.lightBackground,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
    },
    warningText: {
      flex: 1,
      color: theme.gray,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Roboto-Regular',
    },
    button: {
      marginTop: 10,
      borderRadius: 10,
      height: 60,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    shadow: {
      ...Platform.select({
        ios: {
          shadowColor: theme.background,
          shadowOpacity: 0.5,
          shadowRadius: 5,
          shadowOffset: {
            height: 5,
            width: 5,
          },
        },
        android: {
          elevation: 5,
          backgroundColor: theme.background,
        },
      }),
    },
    formInput: {
      width: ITEM_WIDTH - 20,
      marginTop: 16,
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
    },
    textConfirm: {
      marginTop: -15,
      marginBottom: 10,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    textWarning: {
      marginTop: -15,
      marginBottom: 10,
      color: 'red',
      fontSize: 15,
    },
  });

export default myStyles;
