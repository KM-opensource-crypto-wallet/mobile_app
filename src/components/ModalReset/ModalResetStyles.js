import {StyleSheet} from 'react-native';
import {radius, spacing} from 'components/ui/tokens';

const myStyles = theme =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    iconTile: {
      width: 48,
      height: 48,
      borderRadius: radius.control,
      backgroundColor: theme.dangerSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {flex: 1},
    label: {marginBottom: spacing.sm, marginLeft: spacing.xs},
    confirmWord: {color: theme.danger},
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    cancel: {flex: 1},
    confirm: {flex: 1.4},
  });

export default myStyles;
