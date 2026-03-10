import {StyleSheet, Dimensions, Platform} from 'react-native';

const WIDTH = Dimensions.get('window').width + 80;
const HEIGHT = Dimensions.get('window').height;

const isIpad = WIDTH >= 768;

let inputWidth;

if (isIpad) {
  inputWidth = Math.round(WIDTH * 0.8);
} else {
  inputWidth = Math.round(WIDTH * 0.75);
}

const myStyles = theme =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundColor,
      height: HEIGHT,
      flex: 1,
      alignItems: 'center',
    },
    safeAreaView: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    infoList: {
      marginTop: 20,
      width: inputWidth,
    },
    titleInfo: {
      color: theme.font,
      fontSize: 28,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    info: {
      color: theme.gray,
      fontSize: 17,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      marginTop: 20,
    },
    learnText: {
      color: theme.background,
      fontSize: 17,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    btnList: {
      marginTop: 24,
      gap: 16,
    },
    // Full-width horizontal card
    card: {
      flexDirection: 'row',
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    // Image section (left side of card)
    imageBox: {
      width: 150,
      height: 150,
    },
    textBox: {
      position: 'absolute',
      left: '3%',
      bottom: '3%',
    },
    // Text section (right side of card)
    cardContent: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 16,
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      color: theme.font,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      lineHeight: 17,
    },
    textBtn: {
      fontSize: 17,
      fontFamily: 'Roboto-Regular',
    },
    textBox2: {
      position: 'absolute',
      left: '5%',
      bottom: '3%',
    },
  });

export default myStyles;
