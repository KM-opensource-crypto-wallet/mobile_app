import {StyleSheet} from 'react-native';

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: 'rgba(240, 240, 240,0.5)',
    },
    modalView: {
      position: 'relative',
      width: '100%',
      backgroundColor: theme.backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: bottom,
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    closeBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: theme.primary,
      fontSize: 15,
      marginBottom: 20,
      fontFamily: 'Roboto-Regular',
    },
    input: {
      backgroundColor: theme.backgroundColor,
      height: 60,
    },
    textStyle: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    modalText: {
      marginBottom: 15,
      textAlign: 'center',
    },
    modalHeader: {
      padding: 15,
      paddingHorizontal: 20,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
    },
    headerText: {fontSize: 16, color: theme.font},
    modalBody: {padding: 15},

    qrContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    qrBtn: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: 30,
      height: 30,
      borderRadius: 50,
      backgroundColor: theme.font,
    },
    errorText: {
      marginTop: 2,
      marginBottom: 10,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
    },
  });

export default myStyles;
