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
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {ThemeContext} from 'theme/ThemeContext';
import {
  getCurrentWalletPhrase,
  selectCurrentCoin,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import LightningDropDown from 'components/LightningDropDown';
const SCREEN_WIDTH = Dimensions.get('window').width;

const RecieveFunds = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const address = useRef('');
  const currentCoin = useSelector(selectCurrentCoin);
  const currentPhrase = useSelector(getCurrentWalletPhrase);
  address.current = currentCoin?.address ?? '';
  const isLightning =
    currentCoin?.chain_name === 'bitcoin_lightning' ? true : false;
  const chain = getChain(currentCoin?.chain_name);
  const [addressState, setAddressState] = useState('');
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

  const handleLightningDropDownChange = useCallback(
    async currentValue => {
      try {
        let newAddress = '';

        if (currentValue === 'Receive via BTC mainnet') {
          const {address} = await chain.generateInvoiceViaBitcoinAddress(
            currentPhrase,
          );
          newAddress = address;
        } else if (currentValue === 'Receive via Invoice') {
          const {address} = await chain.generateInvoiceViaBolt11(currentPhrase);
          newAddress = address;
        } else if (currentValue === 'Receive via Lightning Address') {
          // generateSparkAddress
          const {address} = await chain.generateSparkAddress(currentPhrase);
          newAddress = address;
        }

        setAddressState(newAddress);
        setProductQRref(`${currentCoin?.symbol}:${newAddress}`);
      } catch (error) {
        console.log(error);
      }
    },
    [chain, currentCoin?.symbol, currentPhrase],
  );

  return (
    <View
      style={styles.container}
      behavior={keyboardHeight}
      scrollEnabled={false}>
      <ScrollView style={styles.section}>
        <Text style={styles.title}>
          Receive funds by providing your address or QR code
        </Text>
        <View style={styles.title}>
          <LightningDropDown
            isLightning={isLightning}
            handleLightningDropDownChange={handleLightningDropDownChange}
          />
        </View>
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
          <Text style={styles.address}>
            {addressState ? addressState : address.current}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(
                addressState ? addressState : address.current,
              );
            }}>
            <CopyIcon fill={theme.background} width={20} height={30} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default RecieveFunds;
