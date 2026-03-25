import {StyleSheet} from 'react-native';

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
      marginLeft: 0,
      backgroundColor: theme.secondaryBackgroundColor,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowOffset: {width: 0, height: 6},
      shadowRadius: 14,
      elevation: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.lightBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionMenu: {
      width: '100%',
      height: 58,
      alignItems: 'center',
      backgroundColor: 'transparent',
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
    },
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
    },
  });

export default myStyles;
