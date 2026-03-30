import {StyleSheet} from 'react-native';

export const myStyles = theme =>
  StyleSheet.create({
    bannerView: {
      backgroundColor: theme.walletItemColor,
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    bannerTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      lineHeight: 20,
    },
    bannerSubtitle: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
    percentText: {
      fontSize: 9,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    closeButton: {
      marginLeft: 12,
    },
  });
