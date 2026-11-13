import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    sponsoredGasRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      marginTop: 14,
      marginBottom: 2,
    },
    sponsoredGasLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 8,
    },
    sponsoredGasText: {
      color: theme.font,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Roboto-Medium',
      fontWeight: '500',
      marginLeft: 12,
      flex: 1,
    },
    sponsoredGasCheckbox: {
      marginBottom: 0,
      marginRight: 0,
    },
    sponsoredGasInfoBtn: {
      paddingLeft: 12,
      paddingRight: 2,
      paddingVertical: 8,
    },
  });

export default myStyles;
