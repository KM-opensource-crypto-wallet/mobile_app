import React, {useContext} from 'react';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {ThemeContext} from 'theme/ThemeContext';
import DokBottomSheet from 'components/BottomSheet';

const DokBottomSheetScrollView = props => {
  const {bottomSheetRef, snapPoints, onDismiss} = props;
  const {theme} = useContext(ThemeContext);

  return (
    <DokBottomSheet
      bottomSheetRef={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={onDismiss}>
      <BottomSheetScrollView
        contentContainerStyle={{backgroundColor: theme.backgroundColor}}>
        {props.children}
      </BottomSheetScrollView>
    </DokBottomSheet>
  );
};
export default DokBottomSheetScrollView;
