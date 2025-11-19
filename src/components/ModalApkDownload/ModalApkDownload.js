import {StyleSheet, Dimensions} from 'react-native';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 2.5;

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
      minHeight: modalHeight - 60,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 15,
      padding: 10,
      borderRadius: 50,
      backgroundColor: theme.primary ? `${theme.primary}20` : '#4CAF5020',
    },
    titleInfo: {
      color: theme.font,
      fontSize: 20,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
      marginBottom: 15,
      textTransform: 'uppercase',
      fontWeight: 'bold',
    },
    info: {
      color: theme.font,
      fontSize: 15,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
      lineHeight: 22,
      marginBottom: 5,
      paddingHorizontal: 5,
    },
    instructionsList: {
      marginTop: 20,
      paddingHorizontal: 15,
      width: '100%',
    },
    instructionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    iconWrapper: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.primary ? `${theme.primary}15` : '#4CAF5015',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    instructionItem: {
      flex: 1,
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      lineHeight: 20,
      textAlign: 'left',
    },
    btnList: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.gray,
    },
    learnBox: {
      width: ITEM_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
      height: 60,
      backgroundColor: theme.primary || '#4CAF50',
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonIcon: {
      marginRight: 8,
    },
    learnText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
  });

export default myStyles;
