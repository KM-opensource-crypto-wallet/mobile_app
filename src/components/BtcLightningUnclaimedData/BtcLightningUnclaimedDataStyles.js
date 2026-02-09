import {StyleSheet, Platform} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    containerContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
    },
    box: {
      marginTop: 10,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerTitle: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    headerNumber: {
      color: theme.background,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    btnList: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
    },
    btn: {
      backgroundColor: theme.background,
      width: 160,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      marginBottom: 24,
    },
    shadow: {
      ...Platform.select({
        ios: {
          shadowColor: '#C0C0C0',
          shadowOffset: {width: 0, height: 5},
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        android: {
          shadowColor: theme.font,
          elevation: 10,
        },
      }),
    },
    btnText: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
    },
    icon: {
      color: theme.background,
      width: 18,
      height: 21,
      marginRight: 10,
    },
    coinList: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    coinIcon: {
      marginTop: 8,
      width: 60,
      height: 60,
      color: theme.backgroundColor,
      backgroundColor: theme.font,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coinBox: {
      flexDirection: 'row',
      marginTop: 8,
      marginBottom: 6,
    },
    coinNumber: {
      fontSize: 18,
      color: theme.font,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    coinSum: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    titleTrans: {
      marginTop: 15,
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      marginBottom: 15,
    },
    addresList: {
      display: 'flex',
      marginTop: 12,
    },
    boxAdress: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    addresTitle: {
      color: theme.gray,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
      fontWeight: '400',
    },
    privateKeyTitle: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
    },
    address: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    privateKey: {
      color: theme.font,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    syncView: {
      paddingHorizontal: 16,
      height: 60,
      flexDirection: 'row',
      backgroundColor: theme.walletItemColor,
      alignItems: 'center',
    },
    syncButton: {
      paddingHorizontal: 24,
      height: 40,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginHorizontal: 12,
    },
    syncTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      flex: 1,
    },

    syncButtonTitle: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    optionsContainer: {
      marginTop: 30,
      width: 200,
    },
    optionMenu: {
      width: '100%',
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
    },
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    card: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 14,
      padding: 18,
      marginHorizontal: 20,
      marginVertical: 12,
      shadowColor: '#888888',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },

    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },

    label: {
      color: '#585858',
      fontSize: 12,
    },

    txid: {
      color: '#979797',
      fontFamily: 'monospace',
    },

    amount: {
      color: '#4caf50',
      fontWeight: '600',
    },

    addressLabel: {
      color: '#ffffff',
      marginTop: 14,
      marginBottom: 10,
      fontWeight: 'bold',
    },

    errorText: {
      color: '#e60000',
      marginTop: 8,
    },

    btnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 14,
    },
  });

export default myStyles;
