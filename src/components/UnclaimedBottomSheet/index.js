import React, {useContext} from 'react';
import {View} from 'react-native';
import myStyles from './styles';

import {ThemeContext} from 'theme/ThemeContext';
import DokBottomSheet from 'components/BottomSheet';
import {BtcLightningUnclaimedData} from 'components/BtcLightningUnclaimedData';
import Toasts from 'components/Toasts';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const UnclaimedBottomSheet = ({bottomSheetRef, onDismiss}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {bottom} = useSafeAreaInsets();
  console.log('bottom', bottom);
  return (
    <DokBottomSheet
      bottomSheetRef={bottomSheetRef}
      snapPoints={['90%']}
      onDismiss={onDismiss}>
      <View style={styles.centeredView}>
        <BtcLightningUnclaimedData onDismiss={onDismiss} />
      </View>
      <Toasts bottomOffset={bottom + 60} />
    </DokBottomSheet>
  );
};

export default UnclaimedBottomSheet;
