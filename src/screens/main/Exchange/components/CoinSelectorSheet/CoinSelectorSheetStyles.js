import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Bold',
      marginHorizontal: 16,
      marginBottom: 12,
    },
    input: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: theme.lightBackground,
    },
    searchInput: {
      minHeight: 0,
      color: theme.font,
    },
    flatlistStyle: {
      flex: 1,
    },
    contentContainerStyle: {
      paddingHorizontal: 6,
      paddingBottom: 24,
    },
    emptyText: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 32,
      marginHorizontal: 24,
    },
  });

export default myStyles;
