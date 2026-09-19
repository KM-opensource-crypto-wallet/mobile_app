import React, {useCallback, useContext, useEffect, useRef} from 'react';
import {StyleSheet} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ThemeContext} from 'theme/ThemeContext';
import {radius, screenPadding, spacing} from './tokens';

/**
 * Bottom sheet for the redesigned surfaces, built on @gorhom/bottom-sheet.
 *
 * Separate from components/BottomSheet.js (DokBottomSheet) on purpose: that one
 * carries the app's older look - opaque `theme.backgroundColor`, `theme.backdrop`
 * scrim, fixed snap points - whereas this follows the Login design's sheet:
 * translucent fill, 28pt top radius, hairline top edge, a lifted shadow and a
 * scrim at the design's own opacity. Sizing is dynamic so the sheet hugs its
 * content.
 *
 * Drag down to dismiss comes from `enablePanDownToClose`.
 *
 * The API stays declarative (`visible` / `onRequestClose`) rather than exposing
 * gorhom's imperative ref, so call sites read like any other modal.
 *
 * NOTE: it needs a BottomSheetModalProvider above it. The navigator has one
 * (components/main.js); LoginModal nests its own because an RN Modal is outside
 * that tree.
 */
const AppBottomSheet = ({
  visible,
  onRequestClose,
  onOpened,
  dismissable = true,
  showHandle = true,
  children,
}) => {
  const {theme} = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);

  // Mirrors whether the sheet is actually presented, which is NOT the same as
  // `visible`: the sheet can close itself (drag, backdrop, back button) before
  // the owner's state catches up. Calling dismiss() on a sheet that is already
  // dismissed - or present() on one already presented - wedges the modal so
  // that no later present() opens it, which is what made it open only once.
  const presentedRef = useRef(false);
  const openedRef = useRef(false);

  useEffect(() => {
    if (visible && !presentedRef.current) {
      presentedRef.current = true;
      sheetRef.current?.present();
    } else if (!visible && presentedRef.current) {
      presentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  // Fires for every close path - backdrop tap, back button, and the pan-down
  // drag - so the owner's `visible` state always follows the sheet. gorhom has
  // already torn the sheet down by this point, so clear the flag here and let
  // the effect skip its redundant dismiss().
  const handleDismiss = useCallback(() => {
    presentedRef.current = false;
    openedRef.current = false;
    onRequestClose?.();
  }, [onRequestClose]);

  // Fired once the sheet has started opening. Anything that needs the sheet to
  // be on screen first - focusing a field, for instance - belongs here rather
  // than at mount, where it would fight the sheet's own keyboard handling.
  const handleChange = useCallback(
    index => {
      if (index >= 0 && !openedRef.current) {
        openedRef.current = true;
        onOpened?.();
      } else if (index < 0) {
        openedRef.current = false;
      }
    },
    [onOpened],
  );

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        // The design's scrim already carries its own alpha, so the backdrop is
        // driven at full opacity rather than gorhom's default 0.5.
        opacity={1}
        style={[props.style, {backgroundColor: theme.scrim}]}
        pressBehavior={dismissable ? 'close' : 'none'}
      />
    ),
    [theme.scrim, dismissable],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      enablePanDownToClose
      enableDismissOnClose
      onDismiss={handleDismiss}
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      handleComponent={showHandle ? undefined : null}
      handleIndicatorStyle={[
        styles.handle,
        {backgroundColor: theme.sheetHandle},
      ]}
      backgroundStyle={[
        styles.sheet,
        {backgroundColor: theme.sheetBg, borderColor: theme.sheetEdge},
      ]}
      style={[styles.shadow, {shadowColor: theme.sheetShadow}]}
      // Without an explicit stacking order the sheet paints behind the screen
      // that opened it - the same reason components/BottomSheet.js sets one.
      containerStyle={styles.container}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <BottomSheetView
        style={[
          styles.content,
          {paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.md},
        ]}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {zIndex: 9999},
  // Design: 0 -16px 60px (light) / 0 -24px 80px (dark). One set of metrics; the
  // colour token carries the per-theme difference.
  shadow: {
    shadowOffset: {width: 0, height: -18},
    shadowRadius: 34,
    shadowOpacity: 1,
    elevation: 24,
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  handle: {width: 40, height: 4},
  content: {
    gap: spacing.lg,
    paddingHorizontal: screenPadding - spacing.xs,
    paddingTop: spacing.xs,
  },
});

export default AppBottomSheet;
