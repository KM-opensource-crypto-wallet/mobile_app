import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    flatlistStyle: {
      backgroundColor: theme.backgroundColor,
      marginTop: 12,
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      width: SCREEN_WIDTH,
      paddingHorizontal: 16,
      paddingBottom: 16 + bottom,
      gap: 12,
    },

    // Card
    card: {
      backgroundColor: theme.backgroundSecondaryColor || theme.backgroundColor,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.gray,
      paddingHorizontal: 14,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    chainIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    chainIconPlaceholder: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.gray,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chainName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.font,
      flex: 1,
    },
    menuTrigger: {
      padding: 6,
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: theme.gray,
      marginVertical: 10,
      opacity: 0.5,
    },

    // RPC URL
    rpcUrl: {
      fontSize: 13,
      color: theme.primary,
      fontWeight: '500',
      letterSpacing: 0.1,
      marginBottom: 8,
    },

    // Wallet row
    walletRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    walletIcon: {
      opacity: 0.6,
    },
    walletNames: {
      fontSize: 12,
      color: theme.font,
      opacity: 0.65,
      flex: 1,
    },

    // Menu options
    optionsContainer: {
      marginTop: 30,
      width: 150,
      paddingHorizontal: 0,
      borderRadius: 10,
      overflow: 'hidden',
    },
    optionMenu: {
      width: '100%',
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      borderBottomColor: theme.gray,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 8,
    },
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    deleteText: {
      color: 'red',
    },
  });

export default myStyles;
