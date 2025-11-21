import {StyleSheet, Dimensions} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const WIDTH = Dimensions.get('window').width;
const itemWidth = WIDTH / 1.2;

const myStyles = theme =>
  StyleSheet.create({
    section: {
      width: WIDTH,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
      paddingVertical: 8,
    },
    list: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    box: {
      width: itemWidth,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 5,
    },
    item: {
      alignItems: 'flex-start',
    },
    itemNumber: {
      alignItems: 'flex-end',
    },
    title: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    hyphen: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginHorizontal: 5,
    },
    text: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    arrow: {
      fill: theme.gray,
    },
    info: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 20,
      textAlign: 'center',
      width: WIDTH / 1.3,
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    button: {
      height: 40,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginHorizontal: 12,
      flexDirection: 'row',
      gap: 12,
      width: SCREEN_WIDTH / 2 - 30,
    },
    buttonTitle: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
  });

export default myStyles;
