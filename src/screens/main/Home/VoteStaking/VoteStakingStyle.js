import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    flatlistStyle: {
      marginBottom: 140,
    },
    contentContainerStyle: {
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      paddingBottom: 20,
    },
    itemDescription: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
    },
    itemDescriptionTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    bottomContainer: {
      padding: 20,
      borderTopColor: theme.headerBorder,
      borderTopWidth: 1,
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: 134,
      backgroundColor: theme.backgroundColor,
    },
    bottomView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    btnText: {
      color: theme.backgroundColor,
    },
    button: {
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
    },
    input: {
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.gray,
      borderRadius: 10,
      marginTop: 20,
      marginBottom: 10,
      fontSize: 18,
      width: SCREEN_WIDTH - 32,
      alignSelf: 'center',
    },
  });

export default myStyles;
