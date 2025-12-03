import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const overlayColor = 'rgba(255,255,255,1)'; // this gives us a black color with a 50% transparency

const rectDimensions = SCREEN_WIDTH * 0.65; // this is equivalent to 255 from a 393 device width
const rectBorderWidth = SCREEN_WIDTH * 0.005; // this is equivalent to 2 from a 393 device width

const scanBarWidth = SCREEN_WIDTH * 0.6; // this is equivalent to 180 from a 393 device width
const scanBarHeight = SCREEN_WIDTH * 0.0025; //this is equivalent to 1 from a 393 device width
const scanBarColor = 'green';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    overlayContainer: {
      ...StyleSheet.absoluteFillObject, // overlay sits on top of camera
      justifyContent: 'center',
      alignItems: 'center',
    },
    rectangleContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 0,
    },

    rectangle: {
      height: rectDimensions,
      width: rectDimensions,
      borderWidth: rectBorderWidth,
      borderColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },

    topOverlay: {
      flex: 1,
      height: SCREEN_WIDTH * 0.2,
      width: SCREEN_WIDTH,
      backgroundColor: overlayColor,
      justifyContent: 'center',
      alignItems: 'center',
    },

    bottomOverlay: {
      flex: 1,
      height: SCREEN_WIDTH * 0.6,
      width: SCREEN_WIDTH,
      backgroundColor: overlayColor,
      paddingBottom: SCREEN_WIDTH * 0.5,
    },

    leftAndRightOverlay: {
      height: SCREEN_WIDTH * 0.65,
      width: SCREEN_WIDTH,
      backgroundColor: overlayColor,
    },

    scanBar: {
      width: scanBarWidth,
      height: scanBarHeight,
      backgroundColor: scanBarColor,
    },
    btnContainer: {
      width: SCREEN_WIDTH,
      backgroundColor: overlayColor,
      alignItems: 'center',
      marginBottom: bottom + 20,
    },
    btn: {
      color: theme.background,
      fontSize: 16,
    },
    bottomStyle: {
      backgroundColor: overlayColor,
    },
  });

export default myStyles;
