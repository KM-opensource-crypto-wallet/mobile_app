import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {ActivityIndicator, View, Text} from 'react-native';
import {BottomSheetFlatList, TouchableOpacity} from '@gorhom/bottom-sheet';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DokBottomSheet from 'components/BottomSheet';
import AddressTypeBadge from 'components/AddressTypeBadge';
import {ThemeContext} from 'theme/ThemeContext';
import {
  getCustomizePublicAddress,
  isBitcoinChain,
} from 'dok-wallet-blockchain-networks/helper';
import myStyles from './AddressSelectorSheetStyles';

const ROW_HEIGHT = 70; // itemView minHeight 60 + marginBottom 10

// Single-select derive-address picker. One mounted sheet serves any number
// of trigger fields: everything row-specific arrives via present(payload),
// and payload.context is handed back to onSelect with the chosen entry.
const AddressSelectorSheet = forwardRef(({onSelect}, ref) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const sheetRef = useRef(null);
  const contextRef = useRef(null);
  const [payload, setPayload] = useState(null);
  // Address whose selection is currently being applied. While set, the sheet
  // stays open with a spinner on that row (onSelect may fetch balances etc.)
  // and closes only once onSelect settles.
  const [applyingAddress, setApplyingAddress] = useState(null);

  useImperativeHandle(
    ref,
    () => ({
      present: data => {
        contextRef.current = data?.context;
        setApplyingAddress(null);
        setPayload(data || null);
        sheetRef.current?.present?.();
      },
      close: () => sheetRef.current?.close?.(),
    }),
    [],
  );

  const onPressItem = useCallback(
    async item => {
      if (applyingAddress) {
        return;
      }
      setApplyingAddress(item?.address);
      try {
        await onSelect?.(item, contextRef.current);
      } catch (e) {
        console.warn('address selection failed', e?.message);
      } finally {
        setApplyingAddress(null);
        sheetRef.current?.close?.();
      }
    },
    [onSelect, applyingAddress],
  );

  const keyExtractor = useCallback(
    item => item?.derivePath || item?.address,
    [],
  );

  const getItemLayout = useCallback(
    (_, index) => ({length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index}),
    [],
  );

  const renderItem = useCallback(
    ({item}) => {
      const isSelected = item?.address === payload?.selectedAddress;
      const isApplying = item?.address === applyingAddress;
      const showBalance = isBitcoinChain(payload?.chain_name);
      return (
        <TouchableOpacity
          style={styles.itemView}
          disabled={!!applyingAddress}
          onPress={() => onPressItem(item)}>
          <View style={styles.textContainer}>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                {getCustomizePublicAddress(item?.address)}
              </Text>
              <AddressTypeBadge chain_name={payload?.chain_name} item={item} />
            </View>
            {!!item?.derivePath && (
              <Text style={styles.derivePathText} numberOfLines={1}>
                {item?.derivePath}
              </Text>
            )}
          </View>
          {showBalance && (
            <Text style={styles.balanceText}>
              {`${item?.balance || 0} ${payload?.symbol || ''}`}
            </Text>
          )}
          {isApplying ? (
            <ActivityIndicator
              size={'small'}
              color={theme.background}
              style={styles.checkIcon}
            />
          ) : (
            isSelected && (
              <IoniconIcon
                name={'checkmark-circle'}
                size={22}
                color={theme.background}
                style={styles.checkIcon}
              />
            )
          )}
        </TouchableOpacity>
      );
    },
    [payload, applyingAddress, onPressItem, styles, theme.background],
  );

  return (
    <DokBottomSheet
      bottomSheetRef={instance => {
        sheetRef.current = instance;
      }}
      snapPoints={['70%']}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{'Select Address'}</Text>
        <BottomSheetFlatList
          bounces={false}
          data={Array.isArray(payload?.items) ? payload.items : []}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          style={styles.flatlistStyle}
          contentContainerStyle={styles.contentContainerStyle}
        />
      </View>
    </DokBottomSheet>
  );
});

AddressSelectorSheet.displayName = 'AddressSelectorSheet';

export default AddressSelectorSheet;
