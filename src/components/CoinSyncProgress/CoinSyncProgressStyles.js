import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      marginBottom: 32,
    },
    circleWrapper: {
      marginBottom: 20,
    },
    progressInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentage: {
      fontSize: 28,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    mainText: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      color: theme.font,
      textAlign: 'center',
    },
    currentCoinText: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginTop: 6,
      textAlign: 'center',
    },
  });

export default myStyles;
