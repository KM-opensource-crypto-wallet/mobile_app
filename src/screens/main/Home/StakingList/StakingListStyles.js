import {Platform, StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    containerContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      paddingVertical: 24,
    },
    btn: {
      backgroundColor: theme.background,
      width: SCREEN_WIDTH - 40,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      marginHorizontal: 20,
      marginBottom: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#C0C0C0',
          shadowOffset: {width: 0, height: 5},
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        android: {
          shadowColor: theme.font,
          elevation: 10,
        },
      }),
    },
    btnText: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
    },
    rowView: {
      paddingLeft: 20,
      paddingRight: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.gray,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    stakingTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      marginBottom: 8,
      marginLeft: 20,
    },
    box: {
      backgroundColor: theme.whiteOutline,
      paddingHorizontal: 16,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 20,
      marginHorizontal: 20,
    },
    itemView: {
      flexDirection: 'row',
      height: 40,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rightItemView: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    buttonStyle: {
      paddingHorizontal: 12,
      justifyContent: 'center',
      height: 32,
      borderWidth: 1,
      borderColor: theme.background,
      borderRadius: 8,
      marginLeft: 8,
    },
    buttonTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    boxTitle: {
      color: theme.font,
      fontSize: 20,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginBottom: 5,
    },
    title: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    boxBalance: {
      color: theme.gray,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    errorTitle: {
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      fontSize: 14,
      color: 'red',
      marginLeft: 20,
      marginBottom: 20,
    },
  });

export default myStyles;
