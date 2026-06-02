import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    stepContainer: {
      flex: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      backgroundColor: theme.secondaryBackgroundColor,
    },
    listContainer: {gap: 12, paddingBottom: 120},
    coinInfo: {
      flex: 1,
      marginLeft: 8,
    },
    coinSymbolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    coinSymbol: {
      fontSize: 16,
      color: theme.font,
      fontFamily: 'Roboto-Bold',
    },
    coinName: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    addressDropdownContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
      marginHorizontal: 16,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    bitcoinInfoContainer: {
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 14,
      borderRadius: 10,
      backgroundColor: '#f59e0b18',
      borderWidth: 1,
      borderColor: '#f59e0b44',
    },
    bitcoinInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bitcoinInfoIcon: {
      marginRight: 8,
    },
    bitcoinInfoText: {
      flex: 1,
      fontSize: 13,
      color: '#92400e',
      fontFamily: 'Roboto-Regular',
      lineHeight: 18,
    },
  });

export default myStyles;
