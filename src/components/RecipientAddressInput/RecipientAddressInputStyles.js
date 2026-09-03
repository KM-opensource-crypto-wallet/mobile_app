import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressInput: {
      flex: 1,
      height: 50,
      backgroundColor: theme.backgroundColor,
    },
    scan: {
      backgroundColor: theme.font,
      marginTop: 15,
    },
    textConfirm: {
      color: theme.error,
      marginLeft: 10,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
  });

export default myStyles;
