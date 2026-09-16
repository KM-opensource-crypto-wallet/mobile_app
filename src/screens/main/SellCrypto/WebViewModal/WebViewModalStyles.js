import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    headerContainer: {
      backgroundColor: theme.backgroundColor,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.whiteOutline,
    },
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 56,
    },
    title: {
      fontSize: 16,
      color: theme.font,
      fontWeight: 'bold',
    },
    domain: {
      fontSize: 12,
      color: theme.gray,
      marginTop: 2,
    },
    doneButton: {
      position: 'absolute',
      right: 16,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    doneText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.background,
    },
    webview: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
  });

export default myStyles;
