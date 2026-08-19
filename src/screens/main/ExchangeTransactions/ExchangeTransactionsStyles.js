import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    footer: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    errorText: {
      color: theme.gray,
      fontSize: 12,
      textAlign: 'center',
      paddingVertical: 6,
    },
  });

export default myStyles;
