import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    itemRow: {
      minHeight: 80,
      width: SCREEN_WIDTH - 40,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
      paddingVertical: 10,
    },
    leftContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 4,
    },
    rowView: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    coinSymbol: {
      fontSize: 16,
      color: theme.font,
      fontWeight: '600',
      flexShrink: 1,
      lineHeight: 20,
    },
    walletName: {
      fontSize: 13,
      color: theme.gray,
      fontWeight: '500',
    },
    address: {
      fontSize: 13,
      color: theme.primary,
      fontWeight: '500',
      flexShrink: 1,
    },
    minAmount: {
      fontSize: 13,
      color: theme.font,
      fontWeight: '500',
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeActive: {
      backgroundColor: theme.background,
    },
    badgeInactive: {
      backgroundColor: theme.gray,
    },
    badgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    menuTrigger: {
      padding: 8,
    },
    optionsContainer: {
      marginTop: 40,
      width: 120,
      borderRadius: 8,
    },
    optionMenu: {
      width: '100%',
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      borderBottomColor: theme.gray,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 8,
    },
    optionMenu2: {
      width: '100%',
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      flexDirection: 'row',
      gap: 8,
    },
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    deleteOptionText: {
      color: 'red',
    },
    trashIcon: {
      marginBottom: 2,
    },
  });

export default myStyles;
