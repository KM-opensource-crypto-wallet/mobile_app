import {StyleSheet} from 'react-native';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    flatlistContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingBottom: 16 + bottom,
    },
    dateSeparator: {
      fontSize: 12,
      color: theme.gray,
      fontFamily: 'Roboto-Medium',
      marginTop: 16,
      marginBottom: 6,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.gray + '22',
    },
    directionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    receiveIconBg: {
      backgroundColor: '#16a34a22',
    },
    sendIconBg: {
      backgroundColor: '#dc262622',
    },
    itemInfo: {
      flex: 1,
    },
    itemTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    coinSymbol: {
      fontSize: 15,
      color: theme.font,
      fontFamily: 'Roboto-Medium',
    },
    amountText: {
      fontSize: 15,
      fontFamily: 'Roboto-Medium',
    },
    receiveAmount: {
      color: '#16a34a',
    },
    sendAmount: {
      color: '#dc2626',
    },
    itemBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    chainText: {
      fontSize: 12,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    timeText: {
      fontSize: 12,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    loader: {
      flex: 1,
      alignSelf: 'center',
    },
    footerLoader: {
      paddingVertical: 16,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.gray,
      fontSize: 15,
      marginTop: 40,
      fontFamily: 'Roboto-Regular',
    },
    // Detail screen
    detailContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    detailContent: {
      padding: 20,
      paddingBottom: 16 + bottom,
    },
    directionBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 20,
      marginBottom: 20,
    },
    receiveBadge: {
      backgroundColor: '#16a34a22',
    },
    sendBadge: {
      backgroundColor: '#dc262622',
    },
    directionBadgeText: {
      fontSize: 14,
      fontFamily: 'Roboto-Medium',
    },
    receiveText: {
      color: '#16a34a',
    },
    sendText: {
      color: '#dc2626',
    },
    detailAmountText: {
      fontSize: 28,
      fontFamily: 'Roboto-Bold',
      color: theme.font,
      marginBottom: 24,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.gray + '22',
    },
    detailLabel: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      flex: 1,
    },
    detailValue: {
      fontSize: 13,
      color: theme.font,
      fontFamily: 'Roboto-Medium',
      flex: 2,
      textAlign: 'right',
    },
    copyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 2,
    },
    copyValue: {
      fontSize: 13,
      color: theme.font,
      fontFamily: 'Roboto-Medium',
      textAlign: 'right',
      flex: 1,
    },
    explorerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 28,
    },
    explorerButtonIcon: {
      marginRight: 8,
    },
    explorerButtonText: {
      fontSize: 15,
      fontFamily: 'Roboto-Medium',
      color: 'white',
    },
  });

export default myStyles;
