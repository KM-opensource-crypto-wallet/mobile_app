import {StyleSheet, Dimensions} from 'react-native';

export const SLIDER_WIDTH = Dimensions.get('window').width + 80;
export const SLIDER_HEIGHT = Dimensions.get('window').height / 3.5;
export const ITEM_HEIGHT = Dimensions.get('window').height / 2.5;

const isIpad = SLIDER_WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = (SLIDER_WIDTH - 80) / 2;
} else {
  ITEM_WIDTH = Math.round(SLIDER_WIDTH * 0.7);
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    section: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: ITEM_WIDTH,
    },
    paginationDotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    inactiveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.carouselPoints,
      marginHorizontal: 5,
    },
    activeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.background,
      marginHorizontal: 5,
    },
    btn: {
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      color:
        theme.backgroundColor === '#121212'
          ? 'rgba(255,255,255,.2)'
          : 'rgba(0,0,0,.2)',
    },
    hidden: {
      display: 'none',
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.background,
      width: ITEM_WIDTH,
    },
    restoreButton: {
      marginTop: 12,
      alignSelf: 'center',
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    //////////////Item////////////
    caruselList: {
      width: ITEM_WIDTH,
      alignSelf: 'center',
    },
    box: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: ITEM_HEIGHT,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: ITEM_WIDTH,
      height: SLIDER_HEIGHT,
    },
    title: {
      color: theme.font,
      fontSize: 34,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
    },
    body: {
      color: theme.primary,
      fontSize: 14,
      marginTop: 20,
      textAlign: 'center',
      fontFamily: 'Roboto-Regular',
    },
  });

export default myStyles;
