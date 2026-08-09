import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 32,
    },
    label: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    value: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
    },
    input: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      padding: 0,
      margin: 0,
      minWidth: 40,
      textAlign: 'right',
    },
    editIcon: {
      marginLeft: 6,
    },
  });

export default myStyles;
