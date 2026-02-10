import {StyleSheet, Platform} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    containerContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },

    // Header Styles
    headerContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
    },

    headerIconWrapper: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.walletItemColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },

    headerTitle: {
      color: theme.font,
      fontSize: 24,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },

    headerSubtitle: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 20,
      marginBottom: 16,
    },

    claimsCountBadge: {
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 4,
    },

    claimsCountText: {
      color: theme.title,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },

    // Empty State Styles
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },

    emptyIconContainer: {
      marginBottom: 24,
      opacity: 0.6,
    },

    emptyTitle: {
      color: theme.font,
      fontSize: 20,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
    },

    emptyDescription: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      lineHeight: 20,
    },
    box: {
      marginTop: 10,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerNumber: {
      color: theme.background,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    btnList: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
    },
    btn: {
      backgroundColor: theme.background,
      width: 160,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      marginBottom: 24,
    },
    shadow: {
      ...Platform.select({
        ios: {
          shadowColor: '#C0C0C0',
          shadowOffset: {width: 0, height: 5},
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        android: {
          shadowColor: theme.font,
          elevation: 10,
        },
      }),
    },
    btnText: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
    },
    icon: {
      color: theme.background,
      width: 18,
      height: 21,
      marginRight: 10,
    },
    coinList: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    coinIcon: {
      marginTop: 8,
      width: 60,
      height: 60,
      color: theme.backgroundColor,
      backgroundColor: theme.font,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coinBox: {
      flexDirection: 'row',
      marginTop: 8,
      marginBottom: 6,
    },
    coinNumber: {
      fontSize: 18,
      color: theme.font,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    coinSum: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    titleTrans: {
      marginTop: 15,
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      marginBottom: 15,
    },
    addresList: {
      display: 'flex',
      marginTop: 12,
    },
    boxAdress: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    addresTitle: {
      color: theme.gray,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
      fontWeight: '400',
    },
    privateKeyTitle: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
    },
    address: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    privateKey: {
      color: theme.font,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    syncView: {
      paddingHorizontal: 16,
      height: 60,
      flexDirection: 'row',
      backgroundColor: theme.walletItemColor,
      alignItems: 'center',
    },
    syncButton: {
      paddingHorizontal: 24,
      height: 40,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginHorizontal: 12,
    },
    syncTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      flex: 1,
    },

    syncButtonTitle: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    optionsContainer: {
      marginTop: 30,
      width: 200,
    },
    optionMenu: {
      width: '100%',
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
    },
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    card: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 10,
      ...Platform.select({
        ios: {
          shadowColor: theme.font,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },

    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      marginTop: 16,
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },

    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.walletItemColor,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 20,
    },

    statusText: {
      color: theme.warningBottom,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginLeft: 6,
      textTransform: 'uppercase',
    },

    amountSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      backgroundColor: theme.walletItemColor,
      padding: 16,
      borderRadius: 12,
    },

    amountIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      ...Platform.select({
        ios: {
          shadowColor: theme.background,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },

    amountDetails: {
      flex: 1,
    },

    amountLabel: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    amountValue: {
      color: theme.font,
      fontSize: 24,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },

    infoSection: {
      marginBottom: 16,
    },

    infoItem: {
      marginBottom: 16,
    },

    infoLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },

    infoLabel: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginLeft: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    infoValue: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
    },

    divider: {
      height: 1,
      backgroundColor: theme.whiteOutline,
      marginVertical: 20,
    },

    refundSection: {
      marginBottom: 16,
    },

    refundHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    refundTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginLeft: 8,
    },

    refundDescription: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginBottom: 16,
      lineHeight: 18,
    },

    textInputStyle: {
      backgroundColor: theme.backgroundColor,
      marginBottom: 12,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },

    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },

    errorText: {
      color: '#e60000',
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginLeft: 6,
    },

    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },

    buttonPrimary: {
      flex: 1,
      backgroundColor: theme.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      minHeight: 50,
    },

    buttonPrimaryText: {
      color: theme.title,
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginLeft: 8,
    },

    buttonSecondary: {
      flex: 1,
      backgroundColor: theme.walletItemColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
      minHeight: 50,
    },

    buttonSecondaryText: {
      color: theme.font,
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginLeft: 8,
    },

    // Legacy styles (keeping for backward compatibility)
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },

    label: {
      color: theme.gray,
      fontSize: 12,
    },

    txid: {
      color: theme.gray,
      fontFamily: 'monospace',
    },

    amount: {
      color: theme.successBottom,
      fontWeight: '600',
    },

    addressLabel: {
      color: theme.font,
      marginTop: 14,
      marginBottom: 10,
      fontWeight: 'bold',
    },

    btnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 14,
    },
  });

export default myStyles;
