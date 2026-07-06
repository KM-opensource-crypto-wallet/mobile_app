import {StyleSheet, Dimensions} from 'react-native';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
      paddingHorizontal: 20,
      backgroundColor: theme.backgroundColor,
      paddingTop: 30,
    },
    inputFrom: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
      paddingVertical: 20,
      borderWidth: 1,
      borderRadius: 6,
      borderColor: theme.whiteOutline,
      backgroundColor: theme.secondaryBackgroundColor,
    },
    lable: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    title: {
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      color: theme.font,
    },
    amountAvailable: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    amountAvailableText: {
      marginRight: 5,
      color: theme.gray,
    },
    scurvedIcon: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingTop: 24,
      paddingBottom: 8,
    },
    select: {
      borderWidth: 0,
      position: 'relative',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectInput: {
      position: 'absolute',
      top: SCREEN_HEIGHT * 0.07,
      left: -SCREEN_WIDTH * 0.01,
    },
    iconBox: {
      width: 39,
      height: 39,
      color: theme.backgroundColor,
      backgroundColor: theme.font,
      borderRadius: 20,
      marginLeft: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginVertical: 5,
    },
    coinTitle: {
      fontFamily: 'Roboto-Regular',
      fontSize: 28,
      color: theme.font,
    },
    errorText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 14,
      color: 'red',
      textAlign: 'right',
      marginTop: 6,
    },
    warningText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 14,
      color: '#FDAB15',
      textAlign: 'center',
      marginBottom: 8,
    },
    picker: {
      width: 1,
    },
    arrow: {
      transform: [{rotate: '90deg'}],
      paddingBottom: 20,
    },
    arrowAmount: {
      paddingLeft: 10,
    },
    textContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 25,
    },
    text: {
      fontFamily: 'Roboto-Regular',
      fontSize: 14,
      color: theme.gray,
    },
    textValue: {
      fontFamily: 'Roboto-Regular',
      fontSize: 14,
      color: theme.font,
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    footer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 25,
    },
    footerText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 15,
      color: theme.gray,
      marginRight: 5,
    },
    addressView: {
      paddingTop: 20,
    },
    sliderContainer: {
      width: '100%',
      marginTop: 16,
    },
    sliderValue: {
      fontFamily: 'Roboto-Regular',
      fontSize: 15,
      color: theme.gray,
      marginBottom: 2,
      textAlign: 'center',
    },
    addCoinText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 15,
      color: theme.gray,
      marginBottom: 2,
      marginTop: 8,
      textAlign: 'center',
    },
    slider: {
      width: '100%',
      height: 40,
    },
    input: {
      marginVertical: 20,
      backgroundColor: theme.backgroundColor,
    },
    boxFooter: {
      flex: 1,
      paddingBottom: 20,
      justifyContent: 'flex-end',
    },
    textStyle: {
      color: theme.primary,
      fontSize: 16,
      marginBottom: 24,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginTop: 20,
      textAlign: 'center',
    },
    selectTitle: {
      fontSize: 15,
      marginTop: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      color: theme.font,
    },
  });

export default myStyles;
