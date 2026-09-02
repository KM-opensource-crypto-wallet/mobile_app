import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {Text, View, useWindowDimensions} from 'react-native';
import {BottomSheetView, TouchableOpacity} from '@gorhom/bottom-sheet';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DokBottomSheet from 'components/BottomSheet';
import Toasts from 'components/Toasts';
import {ThemeContext} from 'theme/ThemeContext';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import myStyles from './AddressQRSheetStyles';

// Displays one address as a QR code. Presented over another sheet (e.g.
// AddressSelectorSheet), so the parent passes zIndex/stackBehavior="push"
// to keep itself mounted underneath. Payload arrives via present(data):
// {address, symbol?, chain_name?, derivePath?}.
const AddressQRSheet = forwardRef(({zIndex, stackBehavior}, ref) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  const styles = myStyles(theme, bottom);
  const sheetRef = useRef(null);
  const [payload, setPayload] = useState(null);

  useImperativeHandle(
    ref,
    () => ({
      present: data => {
        setPayload(data || null);
        sheetRef.current?.present?.();
      },
      close: () => sheetRef.current?.close?.(),
    }),
    [],
  );

  const onPressCopy = useCallback(() => {
    if (!payload?.address) {
      return;
    }
    Clipboard.setString(payload.address);
    triggerHapticFeedbackLight();
    Toast.show({
      type: 'successToast',
      text1: 'Address copied',
    });
  }, [payload?.address]);

  return (
    <DokBottomSheet
      bottomSheetRef={instance => {
        sheetRef.current = instance;
      }}
      enableDynamicSizing={true}
      maxDynamicContentSize={Math.round(windowHeight * 0.85)}
      zIndex={zIndex}
      stackBehavior={stackBehavior}>
      <BottomSheetView style={styles.container}>
        <Text style={styles.headerTitle}>{'Address QR'}</Text>
        {!!payload?.address && (
          <View style={styles.qrContainer}>
            <QRCode value={payload.address} size={windowWidth * 0.55} />
          </View>
        )}
        <Text style={styles.addressText}>{payload?.address}</Text>
        {!!payload?.derivePath && (
          <Text style={styles.derivePathText}>{payload.derivePath}</Text>
        )}
        <TouchableOpacity style={styles.copyButton} onPress={onPressCopy}>
          <IoniconIcon
            name={'copy-outline'}
            size={20}
            color={theme.font}
            style={styles.copyIcon}
          />
          <Text style={styles.copyButtonText}>{'Copy Address'}</Text>
        </TouchableOpacity>
        {/* Toast host inside the sheet so 'Address copied' renders above it
            (the root Toasts sits below the modal host). Absolute-positioned,
            so it does not affect the dynamic content measurement. */}
        <Toasts bottomOffset={bottom + 60} />
      </BottomSheetView>
    </DokBottomSheet>
  );
});

AddressQRSheet.displayName = 'AddressQRSheet';

export default AddressQRSheet;
