import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');

const isIpad = screenWidth >= 768;

let inputWidth;

if (isIpad) {
  inputWidth = screenWidth / 1.15;
} else {
  inputWidth = screenWidth / 1.1;
}

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingTop: 30,
      paddingHorizontal: 15,
      alignItems: 'center',
    },
    section: {
      width: inputWidth,
    },
    title: {
      fontSize: 16,
      fontFamily: 'Roboto-Bold',
      textAlign: 'center',
      color: theme.font,
    },

    qrContainer: {
      marginTop: 10,
      flex: 1,
      justifyContent: 'center',
      textAlign: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    addressTitle: {
      marginTop: 10,
      fontFamily: 'Roboto-Bold',
      textAlign: 'left',
      color: theme.gray,
    },
    addressContainer: {
      marginTop: 20,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    address: {
      fontFamily: 'Roboto-Bold',
      color: theme.gray,
      width: inputWidth * 0.9,
    },
    hederaNote: {
      marginTop: 12,
      fontFamily: 'Roboto-Regular',
      fontSize: 13,
      lineHeight: 18,
      color: theme.gray,
    },
    inputContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    input: {
      width: inputWidth * 0.48,
      flex: 1,
      height: 40,
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      paddingBottom: 0,
      fontFamily: 'Roboto-Bold',
    },
    currencyTitle: {
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
    },
    bannerContainer: {
      backgroundColor: '#FFF3CD',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    bannerText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 13,
      color: '#856404',
      textAlign: 'center',
    },
  });

export default myStyles;
