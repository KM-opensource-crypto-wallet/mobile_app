import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.lightBackground,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'transparent',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      minHeight: 64,
    },
    cardSelected: {
      borderColor: theme.background,
    },
    cardDisabled: {
      opacity: 0.5,
    },
    logoBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      overflow: 'hidden',
      marginRight: 10,
      backgroundColor: theme.backgroundColor,
    },
    logo: {
      height: '100%',
      width: '100%',
    },
    infoBox: {
      flex: 1,
      marginRight: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Bold',
      flexShrink: 1,
    },
    bestBadge: {
      backgroundColor: theme.success,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
      marginLeft: 6,
    },
    bestBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontFamily: 'Roboto-Bold',
      letterSpacing: 0.4,
    },
    minText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 3,
    },
    minTextWarning: {
      color: theme.warning,
    },
    amountBox: {
      alignItems: 'flex-end',
    },
    amountText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Bold',
      maxWidth: 140,
    },
    amountFiat: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
    percentDiff: {
      color: theme.error,
      fontSize: 11,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
    amountUnavailable: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontStyle: 'italic',
    },
  });

export default myStyles;
