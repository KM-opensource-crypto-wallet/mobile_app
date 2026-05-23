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
      marginBottom: 20,
    },
    primaryBtn: {
      backgroundColor: theme.background,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryBtnInRow: {
      backgroundColor: theme.background,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    btnRow: {
      flexDirection: 'row',
      gap: 12,
    },
    secondaryBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.gray + '50',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: theme.font,
      fontSize: 15,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
  });

export default myStyles;
