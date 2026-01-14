import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Text,
  TouchableOpacity,
  Dimensions,
  View,
  StyleSheet,
} from 'react-native';

// import QRCodeScanner from 'react-native-qrcode-scanner';
import * as Animatable from 'react-native-animatable';
import myStyles from './ScannerStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {parseCryptoQrCodeString} from 'dok-wallet-blockchain-networks/helper';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {selectUserCoins} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {setCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import DeviceInfo from 'react-native-device-info';
import {TextInput} from 'react-native-paper';
import {createWalletConnection} from 'dok-wallet-blockchain-networks/service/walletconnect';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;

console.disableYellowBox = true;

// export let web3wallet: IWeb3Wallet <- Add if using TS
// export let core: ICore <- Add if using TS

// const core = new Core({
//   projectId: '9017845dff00ce0da473dd63f21cbef9', //process.env.PROJECT_ID,
// });

// export async function createWeb3Wallet() {
//   const web3wallet = await Web3Wallet.init({
//     core, // <- pass the shared `core` instance
//     metadata: {
//       name: 'Demo React Native Wallet',
//       description: 'Demo RN Wallet to interface with Dapps',
//       url: 'www.walletconnect.com',
//       icons: [],
//     },
//   });
// }

const Scanner = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const page = route.params.page;
  const walletConnect = route.params.walletConnect;
  const dispatch = useDispatch();
  const allUserCoins = useSelector(selectUserCoins, shallowEqual);
  const [isSimulator, setIsSimulator] = useState(false);
  const [text, setText] = useState('');
  const allSymbolId = useMemo(() => {
    let obj = {};
    allUserCoins?.forEach(item => {
      obj[item.symbol?.toUpperCase()] = item._id;
    });
    return obj;
  }, [allUserCoins]);
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [
    {fps: 60},
    {videoAspectRatio: screenAspectRatio},
    {videoResolution: 'max'},
    {photoAspectRatio: screenAspectRatio},
    {photoResolution: 'max'},
  ]);
  const processingQR = useRef(false);

  useEffect(() => {
    // const init = async () => {
    //   await createWeb3Wallet();
    // };
    // init();
    DeviceInfo.isEmulator().then(isEmulator => {
      // false
      setIsSimulator(isEmulator);
    });
  }, []);

  const onSuccess = useCallback(
    ({data}) => {
      if (
        typeof data === 'string' &&
        data?.slice(0, 2) === 'wc' &&
        walletConnect
      ) {
        createWalletConnection({uri: data}).then();
        navigation.popTo('Sidebar', {
          screen: 'Home',
        });
      } else if (page === 'ImportWalletByPrivateKey' || page === 'NewMessage') {
        navigation.navigate({
          name: page,
          params: {
            data,
          },
        });
      } else if (page === 'ManageCoins') {
        const coinObj = parseCryptoQrCodeString(data);
        navigation.navigate({
          name: route.params.page,
          params: {
            qrContractAddress: coinObj?.address,
            newDateToString: new Date().toISOString(),
            selectedNetwork: route.params.selectedNetwork,
          },
        });
      } else if (page === 'SendFunds' || page === 'AddAddress') {
        const coinObj = parseCryptoQrCodeString(data);
        navigation.navigate({
          name: route.params.page,
          params: {
            showModal: false,
            qrAddress: coinObj?.address,
            qrAmount: coinObj?.parameters?.amount,
            newDateToString: new Date().toISOString(),
          },
        });
      } else if (page === 'SendFundsMemo') {
        navigation.navigate({
          name: 'SendFunds',
          params: {
            memo: data,
          },
        });
      } else if (page === 'Home') {
        const coinObj = parseCryptoQrCodeString(data);
        if (allSymbolId[coinObj?.scheme]) {
          dispatch(setCurrentCoin(allSymbolId[coinObj?.scheme]));
          setTimeout(() => {
            navigation.navigate({
              name: 'SendFunds',
              params: {
                showModal: !allSymbolId[coinObj?.scheme],
                qrScheme: coinObj?.scheme,
                qrAddress: coinObj?.address,
                qrAmount: coinObj?.parameters?.amount,
                newDateToString: new Date().toISOString(),
              },
            });
          }, 0);
        } else {
          navigation.popTo({
            name: 'Home',
            params: {
              showModal: !allSymbolId[coinObj?.scheme],
              qrScheme: coinObj?.scheme,
              qrAddress: coinObj?.address,
              qrAmount: coinObj?.parameters?.amount,
              newDateToString: new Date().toISOString(),
            },
          });
        }
      }
      // navigation.navigate({
      //   name: route.params.page,
      //   params: {showModal: true, data},
      // });
    },
    [
      allSymbolId,
      dispatch,
      navigation,
      page,
      route.params.page,
      route.params.selectedNetwork,
      walletConnect,
    ],
  );

  const makeSlideOutTranslation = (translationType, fromValue, toValue) => {
    return {
      from: {
        [translationType]: fromValue,
      },
      to: {
        [translationType]: toValue,
      },
    };
  };

  const onCodeScanned = useCallback(
    async codes => {
      const value = codes[0]?.value;
      if (value && !processingQR.current) {
        processingQR.current = true;
        onSuccess({
          data: value,
        });
        processingQR.current = false;
      }
    },
    [onSuccess],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned,
  });

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  if (isSimulator) {
    return (
      <View style={{flex: 1, paddingTop: 100}}>
        <TextInput
          textColor={theme.font}
          label="Scanner Text"
          placeholder={'Enter Scanner Text'}
          autoCapitalize="none"
          mode="outlined"
          name="Scanner text"
          onChangeText={setText}
          value={text}
        />
        <TouchableOpacity
          style={{
            height: 40,
            marginTop: 30,
            width: '100%',
            backgroundColor: 'blue',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            onSuccess({data: text});
          }}>
          <Text style={{color: 'white', fontSize: 18}}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rectDimensions = SCREEN_WIDTH * 0.65;
  const rectBorderWidth = SCREEN_WIDTH * 0.005;
  const innerRectSize = rectDimensions - rectBorderWidth * 2;
  const scanBarHeight = SCREEN_WIDTH * 0.0025;
  // Animation should move from top to bottom of the inner rectangle
  // Start at top edge: -(innerRectSize / 2 - scanBarHeight / 2)
  // End at bottom edge: (innerRectSize / 2 - scanBarHeight / 2)
  const animationStart = -(innerRectSize / 2 - scanBarHeight / 2);
  const animationEnd = innerRectSize / 2 - scanBarHeight / 2;

  return (
    <>
      {/* Full screen black background to prevent flash */}
      <View
        style={{...StyleSheet.absoluteFillObject, backgroundColor: '#000000'}}
      />

      <View style={{flex: 1}}>
        {/* Overlay structure */}
        <View style={styles.overlayContainer}>
          <View style={styles.topOverlay} />
          <View style={{flexDirection: 'row'}}>
            <View style={styles.leftAndRightOverlay} />

            <View style={styles.rectangle}>
              {/* Camera only in the rectangle */}
              {hasPermission && device && (
                <Camera
                  codeScanner={codeScanner}
                  format={format}
                  device={device}
                  isActive={true}
                  style={styles.cameraView}
                />
              )}

              <Animatable.View
                style={styles.scanBar}
                direction="alternate-reverse"
                iterationCount="infinite"
                duration={1700}
                easing="linear"
                animation={makeSlideOutTranslation(
                  'translateY',
                  animationStart,
                  animationEnd,
                )}
              />
            </View>

            <View style={styles.leftAndRightOverlay} />
          </View>

          <View style={styles.bottomOverlay} />

          <View style={styles.btnContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.btn}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

export default Scanner;
