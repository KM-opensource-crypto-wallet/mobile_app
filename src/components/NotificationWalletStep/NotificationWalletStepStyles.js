import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.whiteOutline,
      gap: 12,
    },
    flexOne: {
      flex: 1,
    },
    listItemText: {
      fontSize: 16,
      color: theme.font,
      fontFamily: 'Roboto-Bold',
    },
    listItemSubtext: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
  });

export default myStyles;
