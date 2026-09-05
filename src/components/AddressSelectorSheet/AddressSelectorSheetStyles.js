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
    // Two text lines on the left, a fixed action column on the right. The
    // shortened address owns line 1; the path and balance share line 2, so no
    // element ever has to ellipsize.
    itemView: {
      paddingHorizontal: 12,
      paddingVertical: 10,
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
      flexShrink: 0,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    derivePathText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    balanceText: {
      flex: 1,
      textAlign: 'right',
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginLeft: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      marginLeft: 8,
    },
    iconButton: {
      padding: 6,
      marginLeft: 4,
    },
    checkIcon: {
      marginLeft: 8,
    },
  });

export default myStyles;
