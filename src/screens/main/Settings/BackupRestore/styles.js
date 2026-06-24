import {StyleSheet} from 'react-native';
import {IS_IOS} from 'utils/dimensions';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 100,
    },
    marginTop20: {
      marginTop: 20,
    },
    text: {
      color: theme.gray,
      fontSize: 16,
      fontWeight: '500',
    },
    headerContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    headerTitleRow: {
      marginBottom: 16,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.font,
      marginBottom: 4,
    },
    subTitle: {
      fontSize: 16,
      color: theme.gray,
    },
    headerRightContainer: {
      marginRight: IS_IOS ? 0 : 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    userInfoTextContainer: {
      marginLeft: 10,
      flex: 1,
    },
    selectAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: theme.backgroundSecondary || theme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder || '#eee',
    },
    selectAllLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectAllText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.font,
    },
    selectionCount: {
      fontSize: 14,
      color: theme.gray,
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 100,
    },

    footer: {
      position: 'absolute',
      bottom: bottom,
      left: 0,
      right: 0,
      backgroundColor: theme.backgroundColor,
      padding: 20,
      paddingBottom: 0,
      borderTopWidth: 1,
      borderTopColor: theme.headerBorder,
    },
    button: {
      backgroundColor: theme.background || '#007bff',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.background,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: {
      opacity: 0.5,
      shadowOpacity: 0,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    menuOptionsContainer: {
      backgroundColor: theme.secondaryBackgroundColor || '#fff',
      borderRadius: 16,
      padding: 5,
      width: 260,
      marginTop: 25,
      marginLeft: -10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 10,
    },
    userInfoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    userInfoDetails: {marginLeft: 10, flex: 1},
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#eee',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.font,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 12,
      color: theme.gray,
    },
    divider: {
      height: 1,
      backgroundColor: theme.headerBorder || '#eee',
      marginHorizontal: 10,
      marginBottom: 5,
    },
    menuOption: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    menuOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuOptionText: {
      marginLeft: 10,
      fontSize: 15,
      fontWeight: '500',
    },
    emptyStateContainer: {
      alignItems: 'center',
      padding: 20,
    },
    emptyStateTitle: {
      marginBottom: 10,
      textAlign: 'center',
    },
    emptyStateDescription: {
      marginBottom: 20,
      textAlign: 'center',
    },
  });

export default myStyles;
