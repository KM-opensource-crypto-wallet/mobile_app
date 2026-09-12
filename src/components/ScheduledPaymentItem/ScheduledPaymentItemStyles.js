import {Platform, StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    card: {
      width: '100%',
      borderRadius: 16,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.headerBorder + '40',
      padding: 16,
      marginBottom: 14,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    // flex:1 + minWidth:0 lets a long amount shrink and ellipsize instead of
    // pushing the kebab off the card.
    amountBox: {
      flex: 1,
      minWidth: 0,
    },
    amountText: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      fontWeight: '700',
    },
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    fiatText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    menuTrigger: {
      padding: 6,
      flexShrink: 0,
    },
    optionsContainer: {
      marginTop: 36,
      width: 150,
      borderRadius: 8,
    },
    optionMenu: {
      width: '100%',
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      borderBottomColor: theme.gray,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 8,
    },
    optionMenuLast: {
      width: '100%',
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      flexDirection: 'row',
      gap: 8,
    },
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    deleteOptionText: {
      color: 'red',
    },
    divider: {
      height: 1,
      backgroundColor: theme.headerBorder + '30',
      marginVertical: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    detailText: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '100%',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: theme.background + '12',
    },
    chipText: {
      color: theme.background,
      fontSize: 12,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
      flexShrink: 1,
    },
  });

export default myStyles;
