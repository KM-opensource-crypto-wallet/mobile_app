import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    stepContainer: {
      flex: 1,
    },
    searchInput: {
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.gray,
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      height: 44,
    },
    searchInputMinHeight: {
      minHeight: 0,
    },
    coinRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.gray,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: theme.background,
      borderColor: theme.background,
    },
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
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
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
    buttonDisabled: {
      backgroundColor: theme.gray,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
  });

export default myStyles;
