import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

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
    textStyle: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
    },
    input: {
      width: '90%',
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
    rowView: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexDirection: 'row',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.background,
    },
    flatlistStyle: {
      backgroundColor: theme.backgroundColor,
      marginTop: 16,
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      width: SCREEN_WIDTH,
      paddingHorizontal: 20,
      paddingBottom: 16 + bottom,
    },
  });

export default myStyles;
