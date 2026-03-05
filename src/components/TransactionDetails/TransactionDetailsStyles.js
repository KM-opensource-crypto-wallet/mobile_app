import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.lightBackground,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: theme.gray,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    hero: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
      backgroundColor: theme.backgroundColor,
      marginBottom: 12,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    txType: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    amount: {
      fontSize: 32,
      fontFamily: 'Roboto-Bold',
      fontWeight: '700',
      marginBottom: 4,
    },
    fiatAmount: {
      fontSize: 16,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      marginBottom: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      gap: 6,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 13,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    card: {
      backgroundColor: theme.backgroundColor,
      marginHorizontal: 16,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingVertical: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      gap: 12,
    },
    rowLabel: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      flexShrink: 0,
    },
    rowValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    rowValue: {
      fontSize: 14,
      color: theme.font,
      fontFamily: 'Roboto-Regular',
      textAlign: 'right',
      flexShrink: 1,
    },
    copyIcon: {
      flexShrink: 0,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.whiteOutline,
    },
    explorerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 16,
      height: 52,
      borderRadius: 14,
      gap: 8,
    },
    explorerBtnText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
  });

export default myStyles;
