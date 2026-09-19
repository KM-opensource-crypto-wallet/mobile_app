import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    card: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 16,
      padding: 24,
      width: '100%',
    },
    title: {
      color: theme.font,
      fontSize: 18,
      fontFamily: 'Roboto-Medium',
      fontWeight: '700',
      marginBottom: 12,
    },
    message: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      lineHeight: 20,
      marginBottom: 16,
    },
    bulletList: {
      width: '100%',
      marginBottom: 6,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.background,
      marginRight: 10,
      marginTop: 7,
    },
    bulletText: {
      color: theme.font,
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
      fontFamily: 'Roboto-Regular',
      opacity: 0.85,
    },
    primaryBtn: {
      backgroundColor: theme.background,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
  });

export default myStyles;
