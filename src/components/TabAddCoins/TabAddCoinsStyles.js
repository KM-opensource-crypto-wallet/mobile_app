import {StyleSheet} from 'react-native';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(240, 240, 240,0.5)',
    },
    modalView: {
      flex: 1,
    },

    input: {
      width: SCREEN_WIDTH - 32,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.gray,
      borderRadius: 10,
      marginTop: 20,
      marginBottom: 10,
      fontSize: 18,
      alignSelf: 'center',
    },
  });

export default myStyles;
