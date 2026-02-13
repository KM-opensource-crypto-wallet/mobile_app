import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');
const isIpad = screenWidth >= 768;
const itemWidth = isIpad ? screenWidth / 1.15 : screenWidth / 1.1;

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    formContainer: {
      width: itemWidth,
      marginTop: 10,
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    stepDotActive: {
      backgroundColor: theme.background,
    },
    stepDotInactive: {
      backgroundColor: theme.gray,
    },
    stepTitle: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      marginBottom: 12,
      textAlign: 'center',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
    },
    listItemText: {
      fontSize: 16,
      color: theme.font,
      fontFamily: 'Roboto-Bold',
      marginLeft: 12,
    },
    listItemSubtext: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      marginLeft: 12,
    },
    listItemRight: {
      marginLeft: 'auto',
    },
    coinRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
    },
    coinInfo: {
      flex: 1,
      marginLeft: 4,
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
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
    },
    addressRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.gray,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    addressRadioSelected: {
      borderColor: theme.background,
    },
    addressRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.background,
    },
    addressText: {
      fontSize: 14,
      color: theme.font,
      fontFamily: 'Roboto-Regular',
      flex: 1,
    },
    summaryCard: {
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      width: 60,
    },
    summaryValue: {
      fontSize: 14,
      color: theme.font,
      fontFamily: 'Roboto-Bold',
      flex: 1,
    },
    changeButton: {
      alignSelf: 'flex-end',
      marginTop: 4,
    },
    changeButtonText: {
      fontSize: 13,
      color: theme.background,
      fontFamily: 'Roboto-Bold',
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
      height: 50,
    },
    textConfirm: {
      marginTop: -15,
      marginBottom: 20,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.gray,
    },
    toggleLabel: {
      fontSize: 16,
      color: theme.font,
      fontFamily: 'Roboto-Bold',
    },
    toggleDesc: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
    },
    buttonDisabled: {
      backgroundColor: theme.gray,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
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
    warningText: {
      color: '#ff9800',
      fontSize: 12,
      marginTop: -10,
      marginBottom: 16,
      marginLeft: 10,
    },
    flexOne: {
      flex: 1,
    },
    summaryRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      marginTop: 4,
    },
    toggleErrorText: {
      marginTop: 8,
    },
    affixText: {
      color: theme.gray,
    },
    searchInputMinHeight: {
      minHeight: 0,
    },
  });

export default myStyles;
