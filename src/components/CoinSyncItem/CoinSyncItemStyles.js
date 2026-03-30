import {StyleSheet} from 'react-native';

export const myStyles = theme =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.walletItemColor,
      marginVertical: 4,
      borderRadius: 12,
    },
    checkboxContainer: {
      marginRight: 12,
    },
    list: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'space-between',
      height: '100%',
    },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    rowStyle: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      maxHeight: 24,
    },
    item: {
      alignItems: 'flex-start',
      flex: 1,
    },
    itemNumber: {
      alignItems: 'flex-end',
    },
    title: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      flexShrink: 1,
    },
    text: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
  });
