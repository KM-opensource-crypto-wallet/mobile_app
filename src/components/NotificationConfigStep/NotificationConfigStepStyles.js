import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');
const isIpad = screenWidth >= 768;
const itemWidth = isIpad ? screenWidth / 1.15 : screenWidth / 1.1;

const myStyles = theme =>
  StyleSheet.create({
    contentContainerStyle: {
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    formContainer: {
      width: itemWidth,
      marginTop: 10,
    },
    coinIconRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 4,
      paddingVertical: 8,
      // gap: 8,
      marginBottom: 8,
    },
    coinIconButton: {
      padding: 6,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    coinIconButtonActive: {
      borderColor: theme.background,
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
    flexOne: {
      flex: 1,
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
    summaryRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      marginTop: 4,
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
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
      height: 50,
    },
    affixText: {
      color: theme.gray,
    },
    textConfirm: {
      marginTop: -15,
      marginBottom: 20,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    warningText: {
      color: '#ff9800',
      fontSize: 12,
      marginTop: -10,
      marginBottom: 16,
      marginLeft: 10,
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
    toggleErrorText: {
      marginTop: 8,
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
