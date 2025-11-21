import React, {useCallback, useContext, useMemo, useRef} from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './WalletsPickerStyles';
import ArrowDown from 'assets/images/buy/arrow-down.svg';
import WalletsPickerSheet from 'components/WalletsPickerSheet';

const WalletsPicker = ({wallets, onChange, onSelectAll}) => {
  const isAllSelected = useMemo(() => {
    return wallets?.length && wallets?.every(wallet => wallet?.isSelected);
  }, [wallets]);
  const bottomSheetRef = useRef();

  const selectedWalletsName = useMemo(() => {
    return wallets
      ?.filter(item => item.isSelected)
      ?.map(wallet => wallet?.walletName);
  }, [wallets]);

  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const onDismissSheet = useCallback(() => {
    bottomSheetRef.current?.close?.();
  }, []);

  const presentBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close?.();
    bottomSheetRef.current?.present?.();
  }, []);
  const isWalletSelected = !!selectedWalletsName?.length;
  return (
    <>
      <TouchableOpacity onPress={presentBottomSheet} style={styles.container}>
        <Text
          numberOfLines={2}
          style={[
            styles.textStyle,
            !isWalletSelected && {color: theme.gray, fontWeight: '500'},
          ]}>
          {isAllSelected
            ? 'All Wallets'
            : isWalletSelected
            ? selectedWalletsName?.join(', ')
            : 'Select Wallet'}
        </Text>
        <ArrowDown height="30" width="30" style={{fill: theme.gray}} />
      </TouchableOpacity>
      <WalletsPickerSheet
        onChange={onChange}
        wallets={wallets}
        bottomSheetRef={ref => {
          bottomSheetRef.current = ref;
        }}
        onDismiss={onDismissSheet}
        onSelectAll={onSelectAll}
      />
    </>
  );
};

export default WalletsPicker;
