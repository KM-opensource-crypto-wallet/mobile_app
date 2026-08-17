import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.lightBackground,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    headerMeta: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    divider: {
      height: 1,
      backgroundColor: theme.headerBorder,
      marginTop: 10,
      marginBottom: 12,
    },
    coinRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    coinTextBox: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },
    coinSymbol: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Bold',
    },
    coinChain: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
    sentAmount: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Medium',
    },
    receivedAmount: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Bold',
    },
    // Aligned with the icon column so the arrow reads as sent → received.
    connectorRow: {
      width: 34,
      alignItems: 'center',
      paddingVertical: 4,
    },
  });

export default myStyles;
