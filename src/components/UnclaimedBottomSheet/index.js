import React, {useContext} from 'react';
import {View} from 'react-native';
import myStyles from '../ModalAddCoins/ModalAddCoinsStyles';

import {ThemeContext} from 'theme/ThemeContext';
import DokBottomSheet from '../../components/BottomSheet';
import {BtcLightningUnclaimedData} from '../../components/BtcLightningUnclaimedData';

const UnclaimedBottomSheet = ({bottomSheetRef, onDismiss}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <DokBottomSheet
      bottomSheetRef={bottomSheetRef}
      snapPoints={['90%']}
      onDismiss={onDismiss}>
      <View style={styles.centeredView}>
        <BtcLightningUnclaimedData onDismiss={onDismiss} />
      </View>
    </DokBottomSheet>
  );
};

export default UnclaimedBottomSheet;
