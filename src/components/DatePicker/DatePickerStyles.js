import {Dimensions, StyleSheet} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');
const isIpad = screenWidth >= 768;
// The iOS inline calendar needs ~320pt to lay out a month; keep the card
// wide enough for it on phones and stop it from sprawling on iPad.
const CARD_WIDTH = isIpad
  ? Math.round(screenWidth * 0.5)
  : Math.round(screenWidth * 0.92);

const myStyles = theme =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      width: CARD_WIDTH,
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 20,
      overflow: 'hidden',
    },
    title: {
      color: theme.font,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      textAlign: 'center',
      paddingTop: 20,
      paddingBottom: 8,
    },
    picker: {
      alignSelf: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
    },
    button: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme.walletItemColor,
    },
    confirmButton: {
      backgroundColor: theme.background,
    },
    cancelText: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    confirmText: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
  });

export default myStyles;
