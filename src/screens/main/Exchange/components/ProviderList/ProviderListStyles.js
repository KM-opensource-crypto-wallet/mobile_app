import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      marginTop: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    headerTitle: {
      color: theme.font,
      fontSize: 15,
      fontFamily: 'Roboto-Bold',
    },
    stateBox: {
      backgroundColor: theme.lightBackground,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
    },
    stateText: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 8,
    },
    errorText: {
      color: theme.error,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 12,
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.background,
    },
    retryText: {
      color: theme.title,
      fontSize: 13,
      fontFamily: 'Roboto-Bold',
    },
  });

export default myStyles;
