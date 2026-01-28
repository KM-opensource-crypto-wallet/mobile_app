import {StyleSheet, Dimensions} from 'react-native';

const WIDTH = Dimensions.get('window').width;

const isIpad = WIDTH >= 768;

let itemWidth;

if (isIpad) {
  itemWidth = WIDTH / 1.12;
} else {
  itemWidth = WIDTH / 1.1;
}

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    walletSection: {
      marginTop: 20,
      width: itemWidth,
      alignSelf: 'center',
    },
    // Modern wallet card styles
    walletCard: {
      marginHorizontal: 16,
      marginVertical: 6,
      borderRadius: 14,
      backgroundColor: theme.secondaryBackgroundColor || theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.headerBorder,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    walletCardSelected: {
      borderWidth: 2,
      borderColor: theme.background,
    },
    // Header row
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dragHandle: {
      marginRight: 10,
      padding: 4,
    },
    walletTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    walletName: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.font,
    },
    walletNameSelected: {
      color: theme.font,
      fontWeight: '700',
      maxWidth: '70%',
      flexWrap: 'wrap',
    },
    activeBadge: {
      backgroundColor: theme.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    activeBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    moveButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(128, 128, 128, 0.1)',
      borderRadius: 6,
      marginRight: 8,
    },
    moveBtn: {
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    settingsBtn: {
      padding: 4,
    },
    // Wallet type
    walletType: {
      fontSize: 13,
      color: theme.gray,
      marginBottom: 14,
      marginLeft: 32,
    },
    walletTypeSelected: {
      color: theme.gray,
    },
    walletTypeNoIndent: {
      marginLeft: 0,
    },
    // Balance section
    balanceSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(128, 128, 128, 0.15)',
    },
    balanceInfo: {
      flex: 1,
    },
    balanceLabel: {
      fontSize: 12,
      color: theme.gray,
      marginBottom: 4,
    },
    balanceLabelSelected: {
      color: theme.gray,
    },
    balanceValue: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.font,
    },
    balanceValueSelected: {
      color: theme.font,
    },
    coinsInfo: {
      alignItems: 'flex-end',
    },
    topCoinsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    coinIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: theme.secondaryBackgroundColor || theme.backgroundColor,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    coinIconWrapperSelected: {
      borderColor: theme.secondaryBackgroundColor || theme.backgroundColor,
    },
    coinIconOverlap: {
      marginLeft: -8,
    },
    coinIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    coinsCount: {
      fontSize: 12,
      color: theme.gray,
    },
    coinsCountSelected: {
      color: theme.gray,
    },
    // Sort menu styles
    sortMenuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sortMenuContainer: {
      position: 'absolute',
    },
    sortMenu: {
      backgroundColor: theme.secondaryBackgroundColor || theme.backgroundColor,
      borderRadius: 12,
      minWidth: 200,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 12,
    },
    sortMenuTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.gray,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    sortMenuItem: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    sortMenuItemActive: {
      backgroundColor: 'rgba(128, 128, 128, 0.15)',
    },
    sortMenuItemText: {
      fontSize: 15,
      color: theme.font,
    },
    sortMenuItemTextActive: {
      color: theme.background,
      fontWeight: '600',
    },
    sortMenuDivider: {
      height: 1,
      backgroundColor: theme.headerBorder,
      marginVertical: 4,
    },
    sortIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'rgba(128, 128, 128, 0.1)',
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
    },
    sortIndicatorText: {
      fontSize: 13,
      color: theme.gray,
      marginRight: 8,
    },
    // Legacy styles (kept for compatibility)
    walletBox: {
      marginTop: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 20,
      paddingRight: 10,
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    title: {color: theme.gray, fontSize: 14, marginLeft: 70},
    textContainer: {paddingHorizontal: 10, flex: 1, marginLeft: 12},
    mainText: {
      fontSize: 18,
      color: theme.gray,
    },
    secondaryText: {
      fontSize: 14,
      color: theme.gray,
      marginTop: 6,
    },
    walletList: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 5,
      paddingRight: 10,
      flex: 1,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatarAvatar: {
      backgroundColor: 'white',
    },
    badge: {
      backgroundColor: '#2F77BA',
      zIndex: 2,
      position: 'absolute',
      top: -5,
      right: -5,
    },
    boxBtn: {
      width: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    input: {
      width: '90%',
      alignSelf: 'center',
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.gray,
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 8,
      fontSize: 16,
      height: 48,
      padding: 0,
      paddingTop: 0,
      alignItems: 'center',
    },
  });

export default myStyles;
