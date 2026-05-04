import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    containerContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
    },
    box: {
      paddingHorizontal: 20,
    },
    titleTrans: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },

    address: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    viewButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    viewButtonText: {
      color: theme.blue,
      fontSize: 16,
      fontFamily: 'Roboto-Bold',
    },
    borderBox: {
      borderTopWidth: 1,
      borderTopColor: theme.gray,
      paddingHorizontal: 20,
    },
    sortList: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    sortTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      textTransform: 'uppercase',
    },
    titleItem: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    typeFilterScrollView: {
      flexGrow: 0,
    },
    typeFilterRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 8,
      gap: 8,
      alignItems: 'center',
    },
    typeFilterTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.gray,
    },
    typeFilterTabActive: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.blue,
      backgroundColor: theme.blue,
    },
    typeFilterTabText: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
    },
    typeFilterTabTextActive: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: '#ffffff',
    },
  });

export default myStyles;
