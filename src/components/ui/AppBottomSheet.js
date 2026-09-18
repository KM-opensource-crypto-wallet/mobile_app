import React, {useContext} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ThemeContext} from 'theme/ThemeContext';
import {radius, screenPadding, spacing} from './tokens';

/**
 * Bottom sheet built on React Native's own Modal.
 *
 * Deliberately NOT @gorhom/bottom-sheet: LoginModal is mounted at
 * components/main.js outside the BottomSheetModalProvider, so a BottomSheetModal
 * rendered from LoginComponent would blow up whenever login is shown in modal
 * mode (app-resume lock, notification tap). An RN Modal works anywhere in the
 * tree, including outside the navigator.
 */
const AppBottomSheet = ({
  visible,
  onRequestClose,
  dismissable = true,
  showHandle = true,
  children,
}) => {
  const {theme} = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={[styles.scrim, {backgroundColor: theme.scrim}]}
          onPress={dismissable ? onRequestClose : undefined}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.sheetBg,
              borderColor: theme.sheetBorder,
              paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.md,
            },
          ]}>
          {showHandle && (
            <View
              style={[styles.handle, {backgroundColor: theme.sheetHandle}]}
            />
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1, justifyContent: 'flex-end'},
  scrim: {...StyleSheet.absoluteFillObject},
  sheet: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    paddingHorizontal: screenPadding - spacing.xs,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  content: {gap: spacing.lg},
});

export default AppBottomSheet;
