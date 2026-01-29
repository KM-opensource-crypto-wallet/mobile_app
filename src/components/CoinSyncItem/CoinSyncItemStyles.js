import {StyleSheet} from 'react-native';

export const myStyles = theme =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.walletItemColor,
      marginVertical: 4,
      borderRadius: 12,
    },
    infoContainer: {
      flex: 1,
      marginRight: 8,
    },
    coinName: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      color: theme.font,
    },
    coinDetails: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginTop: 2,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginRight: 8,
      
    },
    statusIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    synced: {backgroundColor: '#4CAF50'},
    syncedText: {color: '#4CAF50'},
    failed: {backgroundColor: '#f44336'},
    checkboxContainer: {
      marginRight: 12,
    },
  });
