import {StyleSheet} from 'react-native';
import {IS_ANDROID} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: IS_ANDROID ? 20 : 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    button: {
      flex: 1,
      backgroundColor: theme.background,
      paddingVertical: 16,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    buttonCancel: {
      backgroundColor: '#FF5252',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginLeft: 8,
    },
  });

export default myStyles;
