import {StyleSheet} from 'react-native';

export const myStyles = theme =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 28,
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 10,
      zIndex: 9999,
    },
    progressContainer: {
      marginRight: 12,
    },
    textContainer: {
      alignItems: 'flex-start',
    },
    percentText: {
      color: 'white',
      fontSize: 10,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    progressText: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    labelText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11,
      fontFamily: 'Roboto-Regular',
    },
  });
