import {StyleSheet} from 'react-native';
import {isIpad} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    indicatorStyle: {
      backgroundColor: theme.background,
    },
    tabBarStyle: {
      backgroundColor: theme.backgroundColor,
    },
    tabBarFontStyle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      textTransform: 'none',
    },
    badgeView: {
      height: 24,
      width: 24,
      borderRadius: 15,
      position: 'absolute',
      right: -22,
      top: -12,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    badgeText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    headerRightStyle: {
      paddingRight: isIpad ? 50 : 11,
      flexDirection: 'row',
    },
    optionsContainer: {
      marginTop: 30,
      width: 200,
      padding: 0,
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
  });

export default myStyles;
