import {StyleSheet} from 'react-native';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    headerTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    flatlistStyle: {
      flex: 1,
    },
    contentContainerStyle: {
      paddingHorizontal: 20,
      paddingBottom: 16 + bottom,
    },
    itemView: {
      paddingHorizontal: 12,
      flexDirection: 'row',
      backgroundColor: theme.walletItemColor,
      borderRadius: 8,
      marginBottom: 10,
      alignItems: 'center',
      minHeight: 60,
    },
    textContainer: {
      flex: 1,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressText: {
      color: theme.font,
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    derivePathText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
    balanceText: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginLeft: 8,
    },
    checkIcon: {
      marginLeft: 8,
    },
  });

export default myStyles;
