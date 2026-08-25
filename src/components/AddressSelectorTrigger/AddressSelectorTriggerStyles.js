import {StyleSheet} from 'react-native';

// Field sized like DokDropdown's box so replacing the dropdown does not
// shift the surrounding layout.
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
      height: 50,
      borderColor: '#989898',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    leftRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressText: {
      color: theme.font,
      fontSize: 16,
      fontWeight: '600',
      flexShrink: 1,
    },
    balanceText: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginLeft: 8,
    },
  });

export default myStyles;
