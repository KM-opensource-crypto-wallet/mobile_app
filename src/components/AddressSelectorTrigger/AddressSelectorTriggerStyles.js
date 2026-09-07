import {StyleSheet} from 'react-native';

// Field sized like DokDropdown's box so replacing the dropdown does not
// shift the surrounding layout: 50pt tall with one line, and it only grows
// when a bitcoin balance adds a second line.
const myStyles = theme =>
  StyleSheet.create({
    title: {
      fontSize: 15,
      marginBottom: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      color: theme.font,
    },
    field: {
      minHeight: 50,
      paddingVertical: 8,
      borderColor: '#989898',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    leftColumn: {
      flex: 1,
      justifyContent: 'center',
    },
    leftRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressText: {
      color: theme.font,
      fontSize: 16,
      fontWeight: '600',
      flexShrink: 0,
    },
    balanceText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
  });

export default myStyles;
