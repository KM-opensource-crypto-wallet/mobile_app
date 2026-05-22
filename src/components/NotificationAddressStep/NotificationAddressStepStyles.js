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
  });

export default myStyles;
