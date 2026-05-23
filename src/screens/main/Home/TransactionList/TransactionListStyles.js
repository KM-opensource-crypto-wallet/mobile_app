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
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    titleTrans: {
      color: theme.font,
      fontSize: 22,
      fontFamily: 'Roboto-Medium',
      fontWeight: '700',
    },
    subtitle: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 3,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.background + '18',
    },
    viewAllText: {
      color: theme.background,
      fontSize: 13,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    updateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.background + '50',
    },
    updateBtnText: {
      color: theme.background,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
    },
    typeFilterScrollView: {
      flexGrow: 0,
    },
    typeFilterRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 12,
      gap: 8,
      alignItems: 'center',
    },
    typeFilterTab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.gray + '60',
    },
    typeFilterTabActive: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.background,
    },
    typeFilterTabText: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
    },
    typeFilterTabTextActive: {
      fontSize: 13,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
      color: '#ffffff',
    },
    sortBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.gray + '28',
    },
    sortLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
      flexWrap: 'wrap',
    },
    sortText: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
    },
    sortDot: {
      color: theme.gray,
      fontSize: 16,
      lineHeight: 18,
    },
    filterIconBtn: {
      padding: 4,
    },
  });

export default myStyles;
