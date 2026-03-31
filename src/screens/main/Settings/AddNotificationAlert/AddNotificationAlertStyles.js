import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    stepDotActive: {
      backgroundColor: theme.background,
    },
    stepDotInactive: {
      backgroundColor: theme.gray,
    },
  });

export default myStyles;
