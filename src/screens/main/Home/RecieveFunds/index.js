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
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import LightningDropDown from 'components/LightningDropDown';
import {
  getCustomRPCKey,
  getCustomRPCWithData,
  selectAllCustomRpc,
} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSelectors';
const SCREEN_WIDTH = Dimensions.get('window').width;

const RecieveFunds = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const address = useRef('');
  const currentWallet = useSelector(selectCurrentWallet);
  const currentCoin = useSelector(selectCurrentCoin);
  const currentPhrase = useSelector(getCurrentWalletPhrase);
  const allCustomRPC = useSelector(selectAllCustomRpc);
  address.current = currentCoin?.address ?? '';
  const isLightning = currentCoin?.chain_name === 'bitcoin_lightning';
  const [addressState, setAddressState] = useState('');
  const [showBtcMainnetBanner, setShowBtcMainnetBanner] = useState(false);
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
        const customRPC = getCustomRPCWithData(
          allCustomRPC,
          currentCoin?.chain_name,
          currentWallet?.clientId,
        );
        const chain = getChain(
          currentCoin?.chain_name,
          currentWallet?.phrase,
          customRPC,
        );
        let newAddress = '';

        if (currentValue === 'btc_mainnet') {
          setShowBtcMainnetBanner(true);
          const respAddress = await chain.generateInvoiceViaBitcoinAddress(
            currentPhrase,
          );
          newAddress = respAddress?.address;
        } else if (currentValue === 'invoice') {
          setShowBtcMainnetBanner(false);
          const respAddress = await chain.generateInvoiceViaBolt11(
            currentPhrase,
          );
          newAddress = respAddress?.address;
        } else if (currentValue === 'lightning_address') {
          setShowBtcMainnetBanner(false);
          // generateSparkAddress
          const respAddress = await chain.generateSparkAddress(currentPhrase);
          newAddress = respAddress?.address;
        }

        setAddressState(newAddress);
        setProductQRref(`${currentCoin?.symbol}:${newAddress}`);
      } catch (error) {
        console.log(error);
      }
    },
    [currentCoin?.symbol, currentPhrase],
  );

  return (
    <View
      style={styles.container}
      behavior={keyboardHeight}
      scrollEnabled={false}>
      <ScrollView style={styles.section}>
        {showBtcMainnetBanner && (
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerText}>
              Note: On-chain BTC deposits require 4 confirmations before the
              balance is available. You will need to manually claim the deposit
              once confirmed.
            </Text>
          </View>
        )}
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
