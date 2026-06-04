import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      padding: 12,
      paddingBottom: 24,
    },
    row: {
      justifyContent: 'space-between',
    },
    separator: {
      height: 12,
      backgroundColor: theme.backgroundColor,
    },
  });

export default myStyles;
