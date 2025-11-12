import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainer: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
    },
    centerView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    title: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
  });

export default myStyles;
