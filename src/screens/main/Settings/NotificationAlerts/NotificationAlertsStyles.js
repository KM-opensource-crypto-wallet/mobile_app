import {StyleSheet, Platform} from 'react-native';
import {IS_IOS, SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    headerContainer: {
      paddingHorizontal: 16,
      alignItems: 'center',
      width: '100%',
    },
    input: {
      width: '100%',
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.gray,
      borderRadius: 10,
      marginTop: 16,
      marginBottom: 16,
      fontSize: 18,
      height: 50,
      padding: 0,
      paddingTop: 0,
      alignItems: 'center',
    },
    counterText: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      marginTop: 8,
      alignSelf: 'flex-end',
      paddingHorizontal: 16,
    },
    flatlistStyle: {
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      width: SCREEN_WIDTH,
      paddingHorizontal: 20,
      paddingBottom: 16 + bottom,
    },
    headerRightButton: {
      paddingRight: 11,
    },
    searchInputMinHeight: {
      minHeight: 0,
    },
    loader: {
      flex: 1,
      alignSelf: 'center',
    },
    permissionContainer: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: '30%',
      backgroundColor: theme.backgroundColor,
    },
    permissionCard: {
      alignItems: 'center',
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingVertical: 40,
      width: '100%',
      ...Platform.select({
        ios: {
          shadowColor: theme.font,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: {
          shadowColor: theme.font,
          elevation: 6,
        },
      }),
    },
    iconContainer: {
      marginBottom: 24,
      opacity: 0.9,
    },
    permissionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.font,
      fontFamily: 'Roboto-Bold',
      marginBottom: 12,
      textAlign: 'center',
    },
    permissionDescription: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
    },
    settingsButton: {
      backgroundColor: theme.background,
      width: SCREEN_WIDTH / 2,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      ...Platform.select({
        ios: {
          shadowColor: theme.background,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          shadowColor: theme.background,
          elevation: 8,
        },
      }),
    },
    settingsButtonText: {
      fontWeight: '600',
      color: 'white',
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
    },
    bannerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginBottom: 8,
      gap: 8,
      borderLeftWidth: 3,
      borderWidth: 1,
      borderColor: theme.backdrop,
      borderLeftColor: theme.background,
    },
    bannerText: {
      flex: 1,
      fontSize: 13,
      color: theme.font,
      fontFamily: 'Roboto-Regular',
      lineHeight: 18,
    },
  });

export default myStyles;
