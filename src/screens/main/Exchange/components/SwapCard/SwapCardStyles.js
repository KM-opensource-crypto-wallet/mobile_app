import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.lightBackground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
    },
    balance: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
      marginLeft: 12,
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    amountBox: {
      flex: 1,
      marginRight: 12,
    },
    amountInput: {
      color: theme.font,
      fontSize: 28,
      fontFamily: 'Roboto-Bold',
      padding: 0,
      margin: 0,
    },
    amountError: {
      color: theme.error,
    },
    fiatText: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
  });

export default myStyles;
