import React, {useCallback, useContext, useRef} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import DokBottomSheet from 'components/BottomSheet';
import {ThemeContext} from 'theme/ThemeContext';
import {TouchableOpacity} from '@gorhom/bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  refreshCurrentCoin,
  setSelectedDeriveAddress,
  updateCurrentCoin,
} from '../../dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {useDispatch, useSelector} from 'react-redux';
import {selectCurrentCoin} from '../../dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import Clipboard from '@react-native-clipboard/clipboard';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import Toast from 'react-native-toast-message';

const DeriveAddressSheet = ({
  bottomSheetRef,
  onDismiss,
  selectedItem,
  onItemPress,
}) => {
  const {theme} = useContext(ThemeContext);
  const myStyles = styles(theme);
  const bottomRef = useRef();
  const dispatch = useDispatch();
  const currentCoin = useSelector(selectCurrentCoin);
  const {bottom} = useSafeAreaInsets();

  const onSelectAddress = useCallback(async () => {
    bottomRef.current?.close();
    setTimeout(() => {
      onItemPress && onItemPress('select_address');
      dispatch(
        setSelectedDeriveAddress({
          address: selectedItem?.address,
          chain_name: currentCoin?.chain_name,
        }),
      );
    }, 400);
    await dispatch(
      refreshCurrentCoin({
        currentCoin: {
          ...currentCoin,
          address: selectedItem?.address,
          privateKey: selectedItem?.privateKey,
        },
      }),
    ).unwrap();
  }, [
    currentCoin,
    dispatch,
    onItemPress,
    selectedItem?.address,
    selectedItem?.privateKey,
  ]);

  const onPressCopyAddress = useCallback(() => {
    onItemPress && onItemPress('copy_address');
    bottomRef.current?.close();
    Clipboard.setString(selectedItem?.address);
    triggerHapticFeedbackLight();
    Toast.show({
      type: 'successToast',
      text1: 'Address copied',
    });
  }, [onItemPress, selectedItem?.address]);

  const onPressCopyDerivePath = useCallback(() => {
    onItemPress && onItemPress('derive_path');
    bottomRef.current?.close();
    Clipboard.setString(selectedItem?.derivePath);
    triggerHapticFeedbackLight();
    Toast.show({
      type: 'successToast',
      text1: 'Derive Path copied',
    });
  }, [onItemPress, selectedItem?.derivePath]);

  const onPressCopyPrivateKey = useCallback(() => {
    onItemPress && onItemPress('copy_private_key');
    bottomRef.current?.close();
  }, [onItemPress]);

  const onPressDelete = useCallback(() => {
    onItemPress && onItemPress('delete_derive_address');
    bottomRef.current?.close();
  }, [onItemPress]);

  const isSameAddress = currentCoin.address === selectedItem?.address;

  return (
    <DokBottomSheet
      bottomSheetRef={ref => {
        bottomSheetRef(ref);
        bottomRef.current = ref;
      }}
      snapPoints={[(isSameAddress ? 340 : 420) + bottom]}
      onDismiss={onDismiss}>
      <View style={myStyles.mainView}>
        <TouchableOpacity style={myStyles.itemView} onPress={onSelectAddress}>
          <Ionicons
            name={'checkmark-circle-outline'}
            style={myStyles.plusIcon}
            resizeMode={'contain'}
            size={24}
            color={theme.font}
          />
          <Text style={myStyles.title}>{'Make Default'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={myStyles.itemView}
          onPress={onPressCopyAddress}>
          <Ionicons
            name={'copy-outline'}
            style={myStyles.plusIcon}
            resizeMode={'contain'}
            size={24}
            color={theme.font}
          />
          <Text style={myStyles.title}>{'Copy Address'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={myStyles.itemView}
          onPress={onPressCopyDerivePath}>
          <Ionicons
            name={'copy-outline'}
            style={myStyles.plusIcon}
            resizeMode={'contain'}
            size={24}
            color={theme.font}
          />
          <Text style={myStyles.title}>{'Copy Derive Path'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={myStyles.itemView}
          onPress={onPressCopyPrivateKey}>
          <Ionicons
            name={'copy-outline'}
            style={myStyles.plusIcon}
            resizeMode={'contain'}
            size={24}
            color={theme.font}
          />
          <Text style={myStyles.title}>{'Copy Private Key'}</Text>
        </TouchableOpacity>
        {!isSameAddress && (
          <TouchableOpacity style={myStyles.itemView} onPress={onPressDelete}>
            <Ionicons
              name={'trash'}
              style={[myStyles.plusIcon, {marginBottom: 4}]}
              resizeMode={'contain'}
              size={24}
              color={'red'}
            />
            <Text style={[myStyles.title, {color: 'red'}]}>{'Delete'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </DokBottomSheet>
  );
};
const styles = theme =>
  StyleSheet.create({
    mainView: {
      padding: 20,
      backgroundColor: theme.backgroundColor,
    },
    itemView: {
      paddingHorizontal: 16,
      flexDirection: 'row',
      backgroundColor: theme.walletItemColor,
      borderRadius: 8,
      marginBottom: 16,
      alignItems: 'center',
      minHeight: 60,
    },
    title: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    description: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    plusIcon: {
      height: 24,
      width: 24,
      marginRight: 16,
    },
    downloadIcon: {
      height: 24,
      width: 24,
      marginRight: 16,
    },
  });

export default DeriveAddressSheet;
