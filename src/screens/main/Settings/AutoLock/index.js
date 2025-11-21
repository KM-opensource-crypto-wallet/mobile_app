import React from 'react';
import {View} from 'react-native';
import myStyles from './AutoLockStyles';

import {useSelector, useDispatch} from 'react-redux';
import {getLockTimeDisplay} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {updateLockTime} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {useCallback, useContext} from 'react';
import {ThemeContext} from 'theme/ThemeContext';
import DokRadioButton from 'components/DokRadioButton';
import {AUTO_LOCK} from 'dok-wallet-blockchain-networks/helper';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const AutoLock = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const lockTimeDisplay = useSelector(getLockTimeDisplay);
  const dispatch = useDispatch();

  const onChangeLockTime = useCallback(
    selectedLabel => {
      const foundValue =
        AUTO_LOCK.find(item => item.label === selectedLabel)?.value || 0;
      dispatch(updateLockTime(foundValue));
    },
    [dispatch],
  );

  return (
    <DokSafeAreaView style={styles.safeareaView}>
      <View style={styles.container}>
        <DokRadioButton
          title={'Select a auto lock'}
          options={AUTO_LOCK}
          checked={lockTimeDisplay}
          setChecked={onChangeLockTime}
        />
      </View>
    </DokSafeAreaView>
  );
};

export default AutoLock;
