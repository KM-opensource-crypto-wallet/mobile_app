import {StyleSheet} from 'react-native';
import {screenPadding, spacing} from 'components/ui/tokens';

/**
 * Layout only. Colours, type and control metrics live in the UI kit
 * (components/ui) and in ThemeContext.
 */
const myStyles = theme =>
  StyleSheet.create({
    safeAreaView: {flex: 1},
    container: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: screenPadding,
    },
    hero: {
      alignItems: 'center',
      gap: spacing.xl,
    },
    // The keyboard-open layout (design 2a) pulls the logo and hero up so the
    // password row can dock above the keyboard.
    logo: {marginTop: 48},
    logoCompact: {marginTop: spacing.xl},
    heroSpacing: {marginTop: 84},
    heroSpacingCompact: {marginTop: spacing.xxl},
    heroCopy: {alignItems: 'center'},
    subtitle: {marginTop: spacing.xs, textAlign: 'center'},
    title: {textAlign: 'center'},
    bottom: {
      marginTop: 'auto',
      width: '100%',
      gap: spacing.md,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    field: {flex: 1},
    warning: {textAlign: 'center'},
    footer: {
      alignItems: 'center',
      gap: spacing.lg,
      paddingBottom: spacing.lg,
      marginTop: spacing.xs,
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    homeIndicator: {
      width: 134,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.sheetHandle,
    },
  });

export default myStyles;
