import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      width: '100%',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      flexGrow: 1,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    filterPill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 1.5,
      borderColor: theme.headerBorder,
      borderRadius: 20,
      backgroundColor: 'transparent',
    },
    filterPillSelected: {
      borderColor: theme.background,
      borderWidth: 2,
      backgroundColor: theme.background + '15',
    },
    filterPillText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 13,
      color: theme.font,
      fontWeight: '600',
    },
    filterPillTextSelected: {
      color: theme.background,
    },
    summaryBox: {
      marginTop: 8,
      marginBottom: 12,
      marginLeft: 4,
      gap: 2,
    },
    summaryText: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
    },
    summarySubText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    headerAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 8,
      backgroundColor: theme.background + '18',
    },
    headerAddBtnText: {
      color: theme.background,
      fontSize: 14,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingTop: 80,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.gray + '18',
      marginBottom: 16,
    },
    emptyTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      fontWeight: '700',
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      lineHeight: 19,
    },
    emptyAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 24,
      paddingHorizontal: 20,
      height: 48,
      borderRadius: 10,
      backgroundColor: theme.background,
    },
    emptyAddButtonText: {
      color: theme.title,
      fontSize: 15,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
  });

export default myStyles;
