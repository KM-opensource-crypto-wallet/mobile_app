import {StyleSheet, Dimensions} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: 20,
    },
    contentContainerStyle: {
      flexGrow: 1,
      paddingBottom: 20,
    },

    mainView: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    emptyView: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    amountTitle: {
      color: theme.font,
      fontSize: 32,
      textAlign: 'left',
      fontFamily: 'Roboto-bold',
      alignSelf: 'center',
    },

    title: {
      color: theme.font,
      fontSize: 16,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    box: {
      backgroundColor: theme.whiteOutline,
      paddingHorizontal: 16,
      borderRadius: 8,
      overflow: 'hidden',
      marginTop: 24,
    },
    itemView: {
      flexDirection: 'row',
      height: 40,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    boxTitle: {
      color: theme.font,
      fontSize: 20,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginBottom: 5,
    },
    boxBalance: {
      color: theme.gray,
      fontSize: 16,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      alignSelf: 'center',
      flexShrink: 1,
      marginLeft: 8,
    },
    formInput: {
      flex: 1,
    },
    imageStyle: {
      height: 120,
      width: 120,
    },
    centerView: {
      alignItems: 'center',
    },
    button: {
      height: 56,
      borderRadius: 12,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 10,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
    },
    errorText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 14,
      color: 'red',
      textAlign: 'center',
      marginBottom: 8,
    },

    iconView: {
      paddingVertical: 16,
      width: '100%',
      alignItems: 'center',
    },
    // Advanced Options Card Styles
    advancedOptionsCard: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.whiteOutline,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: theme.headerBorder,
    },
    advancedOptionsCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    advancedOptionsCardContent: {
      flex: 1,
    },
    advancedOptionsCardTitle: {
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '600',
      marginBottom: 6,
    },
    advancedOptionsCardDetails: {
      gap: 4,
    },
    advancedOptionsCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    advancedOptionsCardValue: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
    },
    inputContainer: {
      flex: 1,
      height: 56,
    },
  });

export default myStyles;
