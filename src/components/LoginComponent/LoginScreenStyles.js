import {StyleSheet} from 'react-native';
import {screenPadding, spacing} from 'components/ui/tokens';

/**
 * Layout only. Colours, type and control metrics live in the UI kit
 * (components/ui) and in ThemeContext.
 *
 * Anything that changes with the keyboard is animated in index.js off the
 * `collapse` shared value - it deliberately has no "compact" counterpart here,
 * because swapping between two static style objects is what made the old
 * transition snap.
 */
const myStyles = theme =>
  StyleSheet.create({
    safeAreaView: {flex: 1},
    scroll: {flex: 1},
    // flexGrow keeps the content at least a full screen tall so the bottom
    // block's `marginTop: 'auto'` still docks it; anything taller scrolls.
    scrollContent: {flexGrow: 1},
    container: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: screenPadding,
    },
    hero: {
      alignItems: 'center',
    },
    heroCopy: {alignItems: 'center'},
    subtitle: {marginTop: spacing.xs, textAlign: 'center'},
    title: {textAlign: 'center'},
    bottom: {
      marginTop: 'auto',
      width: '100%',
      gap: spacing.md,
    },
    // No `gap` here: the compact biometric button animates its own width from
    // zero, and a gap would reserve space next to a zero-width element.
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
