import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
      backgroundColor: theme.backgroundColor,
    },
    iconBox: {
      width: 30,
      height: 30,
      borderRadius: 15,
      overflow: 'hidden',
      marginRight: 8,
      backgroundColor: theme.lightBackground,
    },
    icon: {
      height: '100%',
      width: '100%',
    },
    labelBox: {
      marginRight: 6,
      flexShrink: 1,
    },
    symbol: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Bold',
    },
    chain: {
      color: theme.gray,
      fontSize: 11,
      fontFamily: 'Roboto-Regular',
    },
  });

export default myStyles;
