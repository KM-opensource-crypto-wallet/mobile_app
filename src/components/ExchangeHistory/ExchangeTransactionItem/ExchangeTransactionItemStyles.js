import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.lightBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 8,
      minHeight: 68,
    },
    logoBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: 'hidden',
      marginRight: 12,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      height: '100%',
      width: '100%',
    },
    infoBox: {
      flex: 1,
      marginRight: 10,
    },
    pair: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Bold',
    },
    subtitle: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 3,
    },
    rightBox: {
      alignItems: 'flex-end',
      marginRight: 6,
    },
    amount: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Medium',
      marginBottom: 4,
    },
  });

export default myStyles;
