import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const PopoverWidth = 180;
const myStyles = theme =>
  StyleSheet.create({
    mainView: {
      width: '100%',
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomColor: theme.headerBorder,
      borderBottomWidth: 1,
      gap: 8,
      paddingLeft: 11,
      paddingRight: 8,
      justifyContent: 'space-between',
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      paddingRight: 16,
    },
    titleButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.borderActiveColor,
    },
    optionsContainer: {
      marginTop: 24,
      width: 180,
      paddingHorizontal: 0,
      marginHorizontal: 0,
      marginLeft: SCREEN_WIDTH - PopoverWidth - 16,
      shadowColor: 'black',
      shadowOpacity: 0.3,
      shadowOffset: {width: 0, height: 0},
      shadowRadius: 5,
      borderRadius: 10,
    },
    optionMenu: {
      width: '100%',
      height: 55,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
    },
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
  });

export default myStyles;
