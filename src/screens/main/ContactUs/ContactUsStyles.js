import { StyleSheet } from 'react-native';
import { SCREEN_WIDTH } from '../../../utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      paddingVertical: 20,
    },
    mainImageStyle: {
      width: SCREEN_WIDTH * 0.8,
      height: 80,
      resizeMode: 'contain',
      alignSelf: 'center',
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      marginBottom: 24,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    title: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      marginHorizontal: 20,
      marginBottom: 24,
    },
    descriptions: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginHorizontal: 20,
      textAlign: 'center',
      marginBottom: 24,
    },
    borderView: {
      height: 1.5,
      backgroundColor: theme.gray,
      width: '100%',
      marginVertical: 24,
      alignSelf: 'center',
    },
    cardBox: {
      marginTop: 20,
      marginHorizontal: 20,
      width: 325,
      height: 186,
    },
    cardItem: {
      height: 186,
      resizeMode: 'contain',
    },
    textContainer: {
      position: 'absolute',
      bottom: 12,
      left: 30,
      overflow: 'hidden',
      width: 285,
      zIndex: 9999,
      gap: 12,
    },
    cardTitle: {
      color: 'white',
      fontSize: 20,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      flexShrink: 1,
    },
    cardDescription: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      marginTop: 6,
      flexShrink: 1,
    },
    cardWrapper: {
      alignItems: 'center',
    },
  });

export default myStyles;
