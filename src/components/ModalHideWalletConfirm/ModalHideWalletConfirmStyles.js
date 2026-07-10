import {StyleSheet, Dimensions, Platform} from 'react-native';
import {isIpad} from 'utils/dimensions';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');

let ITEM_WIDTH;
let ITEM_PAD;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
  ITEM_PAD = 24;
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
  ITEM_PAD = 20;
}

const myStyles = theme =>
  StyleSheet.create({
    contentContainer: {
      backgroundColor: theme.secondaryBackgroundColor,
      width: ITEM_WIDTH,
      alignSelf: 'center',
      borderRadius: 24,
      maxHeight: screenHeight * 0.75,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 10},
          shadowOpacity: 0.25,
          shadowRadius: 20,
        },
        android: {
          elevation: 14,
        },
      }),
    },
    content: {
      padding: ITEM_PAD,
      alignItems: 'center',
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${theme.background}22`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      color: theme.font,
      fontSize: 19,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      marginBottom: 20,
    },
    bulletList: {
      width: '100%',
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.background,
      marginRight: 10,
      marginTop: 7,
    },
    bulletText: {
      color: theme.font,
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
      fontFamily: 'Roboto-Regular',
      opacity: 0.85,
    },
    btnList: {
      paddingHorizontal: ITEM_PAD,
      paddingBottom: ITEM_PAD,
      gap: 10,
    },
    primaryBtn: {
      backgroundColor: theme.background,
      borderRadius: 14,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtnText: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    secondaryBtn: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: theme.gray,
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
  });

export default myStyles;
