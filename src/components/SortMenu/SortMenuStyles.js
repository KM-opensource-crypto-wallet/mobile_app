import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
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
  });

export default myStyles;
