import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');
const itemWidth = screenWidth / 1.4;

const myStyles = theme =>
  StyleSheet.create({
    selectTitle: {
      fontSize: 15,
      marginBottom: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      color: theme.font,
    },
    dropdown: {
      height: 50,
      borderColor: '#989898',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 15,
      marginBottom: 20,
    },
    placeholderStyle: {
      fontSize: 16,
      borderRadius: 5,
      color: theme.gray,
    },
    selectedTextStyle: {
      fontSize: 16,
      color: theme.font,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    list: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 39,
      height: 39,
      backgroundColor: theme.font,
      borderRadius: 20,
      marginLeft: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginTop: 10,
      marginBottom: 10,
    },
    items: {
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
      width: itemWidth,
    },
    title: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 10,
    },
    text: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginBottom: 10,
    },
    titleAmount: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 10,
    },
    textConfirm: {
      marginTop: -15,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
    inputSearchStyle: {
      fontSize: 16,
      color: theme.font,
    },
  });

export default myStyles;
