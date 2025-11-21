import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundColor,
      paddingVertical: 20,
      flex: 1,
    },
    title: {
      color: theme.font,
      fontSize: 24,
      fontFamily: 'Roboto-Regular',
      marginLeft: 20,
    },
    mainContainer: {
      marginTop: 20,
      flex: 1,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.gray,
    },
    main: {
      width: SCREEN_WIDTH,
    },
  });

export default myStyles;
