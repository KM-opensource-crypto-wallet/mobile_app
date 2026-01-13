import {StyleSheet, Dimensions} from 'react-native';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let itemWidth;

if (isIpad) {
  itemWidth = Math.round(WIDTH * 0.48);
} else {
  itemWidth = Math.round(WIDTH * 0.68);
}

const myStyles = theme =>
  StyleSheet.create({
    section: {
      paddingVertical: 5,
      flex: 1,
      justifyContent: 'center',
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 5,
      paddingRight: 10,
    },
    headerBox: {
      paddingLeft: 10,
      width: 160,
    },
    title: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
    },
    titleItem: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginLeft: 12,
    },
    btn: {
      backgroundColor: theme.headerBorder,
      width: 100,
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
    },
    btnTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    item: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    itembox: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    btnSubmit: {
      backgroundColor: theme.background,
      width: itemWidth - 10,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      alignSelf: 'center',
      marginTop: 10,
    },
    btnSubmitTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    scrollContainer: {
      flex: 1,
    },
  });

export default myStyles;
