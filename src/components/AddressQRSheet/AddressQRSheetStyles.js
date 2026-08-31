import {StyleSheet} from 'react-native';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: 20,
      paddingBottom: 16 + bottom,
    },
    headerTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      paddingBottom: 12,
    },
    // Explicit white so the QR stays scannable in dark theme.
    qrContainer: {
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
    },
    addressText: {
      color: theme.font,
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 16,
    },
    derivePathText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 4,
    },
    copyButton: {
      paddingHorizontal: 16,
      flexDirection: 'row',
      backgroundColor: theme.walletItemColor,
      borderRadius: 8,
      marginTop: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
    },
    copyIcon: {
      marginRight: 12,
    },
    copyButtonText: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
  });

export default myStyles;
