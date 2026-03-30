import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    container: {
      backgroundColor: theme.walletItemColor,
      padding: 32,
      borderRadius: 20,
      alignItems: 'center',
      marginHorizontal: 32,
    },
    title: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginTop: 20,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default myStyles;
