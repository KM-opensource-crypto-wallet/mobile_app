import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      paddingVertical: 20,
    },
    mainImageStyle: {
      width: SCREEN_WIDTH * 0.8,
      height: 80,
      resizeMode: 'contain',
      alignSelf: 'center',
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    borderView: {
      height: 1.5,
      backgroundColor: theme.gray,
      width: '100%',
      marginVertical: 24,
      alignSelf: 'center',
    },
  });

export default myStyles;
