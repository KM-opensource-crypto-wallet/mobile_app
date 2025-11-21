import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    itemRow: {
      minHeight: 80,
      width: SCREEN_WIDTH - 40,
      alignItems: 'center',
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
      paddingVertical: 8,
    },
    leftContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 4,
    },
    rowView: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    itemTitle: {
      fontSize: 16,
      color: theme.font,
      fontWeight: '600',
      flexShrink: 1,
      lineHeight: 20,
    },
    itemSubtitle: {
      fontSize: 14,
      color: theme.font,
      fontWeight: '500',
      flexShrink: 1,
      lineHeight: 20,
    },
    itemDescription: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
      flexShrink: 1,
    },
    optionsContainer: {
      marginTop: 30,
      width: 150,
      paddingHorizontal: 0,
      marginHorizontal: 0,
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
    optionText: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
  });

export default myStyles;
