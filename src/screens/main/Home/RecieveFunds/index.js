import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import myStyles from './RecieveFundsStyles';
import QRCode from 'react-native-qrcode-svg';
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import CopyIcon from 'assets/images/icons/copy.svg';
import Share from 'react-native-share';
import {CommonActions} from '@react-navigation/native';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import Clipboard from '@react-native-clipboard/clipboard';
import {useSelector} from 'react-redux';

import {ThemeContext} from 'theme/ThemeContext';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
const SCREEN_WIDTH = Dimensions.get('window').width;

const RecieveFunds = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const currentCoin = useSelector(selectCurrentCoin);
  const address = currentCoin?.address;
  const [productQRref, setProductQRref] = useState(
    `${currentCoin?.symbol}:${address}`,
  );
  const [tempState, setTempState] = useState(false);

  useEffect(() => {
    setProductQRref(`${currentCoin?.symbol}:${currentCoin.address}`);
  }, [currentCoin.address, currentCoin?.symbol]);

  const keyboardHeight = useKeyboardHeight();

  const qrCodeRef = useRef();

  const shareQR = useCallback(async () => {
    qrCodeRef.current.toDataURL(dataUrl => {
      const address = currentCoin.address;
      const shareImageBase64 = {
        title: 'React Native',
        url: `data:image/png;base64,${dataUrl.replace(/(\r\n|\n|\r)/gm, '')}`,
        subject: address, //  for email
        type: 'PNG',
        filename: 'QRCode.png',
        message: address,
      };
      Share.open(shareImageBase64).catch(error => console.log(error));
    });
    setTimeout(() => {
      setTempState(prevState => !prevState);
    }, 0);
  }, [currentCoin.address]);

  useEffect(() => {
    navigation.dispatch(CommonActions.setParams({shareQR}));
  }, [navigation, shareQR]);

  return (
    <View
      style={styles.container}
      behavior={keyboardHeight}
      scrollEnabled={false}>
      <ScrollView style={styles.section}>
        <Text style={styles.title}>
          Receive funds by providing your address or QR code
        </Text>
        <Text style={styles.qrContainer}>
          <QRCode
            value={productQRref}
            size={SCREEN_WIDTH * 0.7}
            quietZone={SCREEN_WIDTH * 0.12}
            getRef={ref => (qrCodeRef.current = ref)}
          />
        </Text>
        <Text style={styles.addressTitle}>YOUR ADDRESS</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.address}>{address}</Text>
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(address);
            }}>
            <CopyIcon fill={theme.background} width={20} height={30} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default RecieveFunds;
