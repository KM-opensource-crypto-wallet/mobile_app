import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    centerContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    blockText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      textAlign: 'center',
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
    },
    messageErrorContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.walletItemColor,
      maxWidth: 320,
      alignSelf: 'center',
      borderRadius: 8,
    },
    replyToContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderTopWidth: 0.2,
      borderTopColor: theme.gray,
    },
    replyToContainerHeader: {
      flex: 1,
      flexDirection: 'column',
      gap: 5,
    },
    replyToContainerHeaderText: {
      fontSize: 14,
      color: theme.font,
    },
    replyToContainerMessageText: {
      fontSize: 14,
      color: theme.gray,
      fontWeight: '600',
    },
    replyContainerMessage: {
      backgroundColor: '#B8CDEE',
      padding: 10,
      margin: 8,
      borderRadius: 10,
      borderLeftWidth: 5,
      borderLeftColor: theme.backgroundColor,
    },
    errorText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 14,
      color: 'red',
      textAlign: 'center',
    },
    navigationTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.borderActiveColor,
    },
    keyboardAvoidingView: {
      flex: 1,
      paddingTop: 10,
    },
    textInput: {
      color: theme.font,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  });

export default myStyles;
