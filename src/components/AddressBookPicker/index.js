import React, {useCallback, useContext, useRef} from 'react';
import {TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddressBookPickerStyles';

import AntDesign from 'react-native-vector-icons/AntDesign';
import AddressPickerSheet from 'components/AddressPickerSheet';

const AddressBookPicker = ({chain_name, walletId, onSelectAddress}) => {
  const bottomSheetRef = useRef();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const onDismissSheet = useCallback(() => {
    bottomSheetRef.current?.close?.();
  }, []);

  const presentBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close?.();
    bottomSheetRef.current?.present?.();
  }, []);

  const onPressItem = useCallback(
    item => {
      onDismissSheet();
      onSelectAddress?.(item);
    },
    [onDismissSheet, onSelectAddress],
  );
  return (
    <>
      <TouchableOpacity onPress={presentBottomSheet} style={styles.container}>
        <AntDesign name={'contacts'} color={theme.font} size={32} />
      </TouchableOpacity>
      <AddressPickerSheet
        bottomSheetRef={ref => {
          bottomSheetRef.current = ref;
        }}
        chain_name={chain_name}
        onDismiss={onDismissSheet}
        walletId={walletId}
        onSelectedAddress={onPressItem}
      />
    </>
  );
};

export default AddressBookPicker;
