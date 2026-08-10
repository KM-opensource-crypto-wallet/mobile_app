import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: theme.headerBorder,
      opacity: 0.4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
    },
    rowLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.background + '14',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    rowLabel: {
      color: theme.gray,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
    },
    rowValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
    },
    rowValue: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Medium',
      flexShrink: 1,
      textAlign: 'right',
    },
    rowIcon: {
      marginLeft: 6,
    },
  });

export default myStyles;
