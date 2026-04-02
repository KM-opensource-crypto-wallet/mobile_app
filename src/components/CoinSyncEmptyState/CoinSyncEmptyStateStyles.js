import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    title: {
      fontSize: 20,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      color: theme.font,
      marginTop: 16,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      textAlign: 'center',
      marginTop: 8,
    },
  });

export default myStyles;
