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
    input: {
      width: '100%',
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
    counterText: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      marginTop: 8,
      alignSelf: 'flex-end',
      paddingHorizontal: 16,
    },
    flatlistStyle: {
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      width: SCREEN_WIDTH,
      paddingHorizontal: 20,
      paddingBottom: 16 + bottom,
    },
    headerRightButton: {
      paddingRight: 11,
    },
    searchInputMinHeight: {
      minHeight: 0,
    },
    loader: {
      flex: 1,
      alignSelf: 'center',
    },
  });

export default myStyles;
