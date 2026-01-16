import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    safeAreaView: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    searchInput: {
      width: SCREEN_WIDTH - 32,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.gray,
      borderRadius: 10,
      marginTop: 16,
      marginBottom: 10,
      fontSize: 18,
      alignSelf: 'center',
    },
    selectedCount: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    listContent: {
      paddingBottom: 20,
    },
    section: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 56,
      paddingHorizontal: 16,
    },
    checkboxContainer: {
      marginRight: 12,
    },
    list: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
      flex: 1,
      justifyContent: 'space-between',
      height: '100%',
    },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    rowStyle: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      maxHeight: 24,
    },
    item: {
      alignItems: 'flex-start',
      flex: 1,
    },
    title: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    text: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
    },
    defaultBadge: {
      backgroundColor: theme.background,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    defaultBadgeText: {
      color: theme.title,
      fontSize: 10,
      fontFamily: 'Roboto-Regular',
    },
    button: {
      marginHorizontal: 20,
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      marginTop: 10,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: theme.gray,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.secondaryBackgroundColor,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionHeaderTitle: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Bold',
    },
    sectionHeaderCount: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginLeft: 8,
    },
  });

export default myStyles;
