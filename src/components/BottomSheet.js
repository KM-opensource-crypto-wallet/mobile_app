import React, {useMemo, useContext, useRef, useCallback} from 'react';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {ThemeContext} from 'theme/ThemeContext';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {useBottomSheetBackHandler} from 'hooks/useBottomSheetBackHandler';
import {Pressable} from 'react-native';

const CustomBackdrop = props => {
  // animated variables
  const {animatedIndex, style, dismiss, backdropZIndex = 9998} = props;
  const {theme} = useContext(ThemeContext);
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  // styles
  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: theme.backdrop,
        zIndex: backdropZIndex,
      },
      containerAnimatedStyle,
    ],
    [style, theme.backdrop, containerAnimatedStyle, backdropZIndex],
  );

  return (
    <Pressable
      onPress={dismiss}
      style={{
        height: '100%',
        position: 'absolute',
        width: '100%',
        zIndex: backdropZIndex,
      }}>
      <Animated.View style={containerStyle} />
    </Pressable>
  );
};

const DokBottomSheet = props => {
  const {
    bottomSheetRef,
    snapPoints,
    onDismiss,
    onChange,
    keyboardBehavior = 'interactive',
    keyboardBlurBehavior = 'restore',
    android_keyboardInputMode = 'adjustResize',
    enableDynamicSizing = false,
    maxDynamicContentSize,
    // Layer of this sheet. Sheets opened OVER another sheet must pass a higher
    // value so their backdrop covers (dims + blocks touches on) the one beneath.
    zIndex = 9999,
    stackBehavior,
  } = props;
  const {theme} = useContext(ThemeContext);
  const localBottomSheetRef = useRef();
  const snapPointsLocal = useMemo(() => snapPoints || ['40%'], [snapPoints]);
  const backdropZIndex = zIndex - 1;
  const {handleSheetPositionChange} =
    useBottomSheetBackHandler(localBottomSheetRef);

  const onLocalChange = useCallback(
    index => {
      handleSheetPositionChange(index);
      onChange?.(index);
    },
    [handleSheetPositionChange, onChange],
  );

  const renderBackdrop = useCallback(
    subProps => {
      return (
        <CustomBackdrop
          {...subProps}
          backdropZIndex={backdropZIndex}
          dismiss={() => localBottomSheetRef.current?.close()}
        />
      );
    },
    [backdropZIndex],
  );
  return (
    <BottomSheetModal
      ref={ref => {
        localBottomSheetRef.current = ref;
        bottomSheetRef(ref);
      }}
      enableDynamicSizing={enableDynamicSizing}
      snapPoints={enableDynamicSizing ? undefined : snapPointsLocal}
      maxDynamicContentSize={maxDynamicContentSize}
      backgroundStyle={{backgroundColor: theme.backgroundColor}}
      index={0}
      handleIndicatorStyle={{backgroundColor: theme.primary}}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
      onDismiss={onDismiss}
      closeOnPress={true}
      onChange={onLocalChange}
      backdropComponent={renderBackdrop}
      {...(stackBehavior ? {stackBehavior} : {})}
      containerStyle={{zIndex}}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      android_keyboardInputMode={android_keyboardInputMode}>
      {props.children}
    </BottomSheetModal>
  );
};
export default DokBottomSheet;
