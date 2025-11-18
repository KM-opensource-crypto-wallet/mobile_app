import React, {useMemo, useContext, useRef, useCallback} from 'react';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
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
  const {animatedIndex, style, dismiss} = props;
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
      },
      containerAnimatedStyle,
    ],
    [style, theme.backdrop, containerAnimatedStyle],
  );

  return (
    <Pressable
      onPress={dismiss}
      style={{height: '100%', position: 'absolute', width: '100%'}}>
      <Animated.View style={containerStyle} />
    </Pressable>
  );
};

const DokBottomSheet = props => {
  const {bottomSheetRef, snapPoints, onDismiss, onChange} = props;
  const {theme} = useContext(ThemeContext);
  const localBottomSheetRef = useRef();
  const snapPointsLocal = useMemo(() => snapPoints || ['40%'], [snapPoints]);
  const {handleSheetPositionChange} =
    useBottomSheetBackHandler(localBottomSheetRef);

  const onLocalChange = useCallback(
    index => {
      handleSheetPositionChange(index);
      onChange?.(index);
    },
    [handleSheetPositionChange, onChange],
  );

  const renderBackdrop = useCallback(subProps => {
    return (
      <CustomBackdrop
        {...subProps}
        dismiss={() => localBottomSheetRef.current?.close()}
      />
    );
  }, []);
  return (
    <BottomSheetModal
      ref={ref => {
        localBottomSheetRef.current = ref;
        bottomSheetRef(ref);
      }}
      snapPoints={snapPointsLocal}
      backgroundStyle={{backgroundColor: theme.backgroundColor}}
      index={0}
      enableDynamicSizing={false}
      handleIndicatorStyle={{backgroundColor: theme.primary}}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
      onDismiss={onDismiss}
      closeOnPress={true}
      onChange={onLocalChange}
      backdropComponent={renderBackdrop}>
    {props.children}
    </BottomSheetModal>
  );
};
export default DokBottomSheet;
