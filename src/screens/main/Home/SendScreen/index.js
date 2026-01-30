import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import myStyles from './SendScreenStyles';
import SendIcon from 'assets/images/send/send.svg';
import RecIcon from 'assets/images/send/rec.svg';
import {useSelector, useDispatch} from 'react-redux';
import CopyIcon from 'assets/images/icons/copy.svg';
import Clipboard from '@react-native-clipboard/clipboard';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';

import {ThemeContext} from 'theme/ThemeContext';
import {currencySymbol} from 'data/currency';
import {
  checkIsNativeCoinAvailable,
  getCurrentWalletIsAddMoreAddressPopupHidden,
  isImportWalletWithPrivateKey,
  selectCurrentCoin,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  addEVMAndTronDeriveAddresses,
  refreshCurrentCoin,
  setIsAddMoreAddressPopupHidden,
  setSelectedDeriveAddress,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import FastImage from '@d11/react-native-fast-image';
import Loading from 'components/Loading';
import ModalConfirmTransaction from 'components/ModalConfirmTransaction';
import Toast from 'react-native-toast-message';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import {
  getCustomizePublicAddress,
  isBitcoinChain,
  isDeriveAddressSupportChain,
  isPrivateKeyNotSupportedChain,
  isStakingChain,
} from 'dok-wallet-blockchain-networks/helper';
import DokDropdown from 'components/DokDropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import ModalAdvanceCustomDerivation from 'components/ModalAdvanceCustomDerivation';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {clearSelectedUTXOs} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {isCustomDerivedChecked} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';

const SendScreen = ({navigation, route}) => {
  const currentCoin = useSelector(selectCurrentCoin);
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const isImportWithPrivateKey = useSelector(isImportWalletWithPrivateKey);
  const isAddMoreAddressPopupHide = useSelector(
    getCurrentWalletIsAddMoreAddressPopupHidden,
  );
  const isNativeCoinAvailable = useSelector(checkIsNativeCoinAvailable);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const isCheckedStored = useSelector(isCustomDerivedChecked);
  const isCustomDerivationClicked = useRef(false);

  const {item} = route.params;
  const isBitcoin = isBitcoinChain(currentCoin?.chain_name);
  const isStaking =
    isStakingChain(currentCoin?.chain_name) && currentCoin?.type === 'coin';
  const isDeriveAddressChain = isDeriveAddressSupportChain(
    currentCoin?.chain_name,
  );
  const dispatch = useDispatch();

  const deriveAddresses = useMemo(() => {
    return currentCoin?.deriveAddresses?.map(subItem => ({
      options: subItem,
      label: `${getCustomizePublicAddress(subItem?.address)} ${
        isBitcoin ? `(${subItem?.balance || 0} ${currentCoin?.symbol})` : ''
      }`,
      value: subItem.address,
    }));
  }, [currentCoin?.deriveAddresses, currentCoin?.symbol, isBitcoin]);

  const coinId = useMemo(() => {
    return currentCoin?._id + currentCoin?.name + currentCoin?.chain_name;
  }, [currentCoin]);

  useEffect(() => {
    if (currentCoin?.address) {
      dispatch(refreshCurrentCoin())
        .unwrap()
        .then(() => {
          setIsLoading(false);
        })
        .catch(e => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinId, dispatch]);

  const address = currentCoin?.address;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(refreshCurrentCoin()).unwrap();
    setRefreshing(false);
  }, [dispatch]);

  const onSuccessOfPrivateKey = useCallback(() => {
    setShowConfirmModal(false);
    if (isCustomDerivationClicked.current) {
      navigation.navigate('CustomDerivation');
    } else if (currentCoin?.privateKey) {
      Clipboard.setString(currentCoin?.privateKey);
      triggerHapticFeedbackLight();
      Toast.show({
        type: 'successToast',
        text1: 'Private key copied',
      });
    }
  }, [currentCoin?.privateKey, navigation]);

  const onChangeSelectedAddress = useCallback(
    async subItem => {
      dispatch(
        setSelectedDeriveAddress({
          address: subItem.options?.address,
          chain_name: currentCoin?.chain_name,
        }),
      );

      await dispatch(
        refreshCurrentCoin({
          currentCoin: {
            ...currentCoin,
            address: subItem.options?.address,
            privateKey: subItem?.options?.privateKey || currentCoin?.privateKey,
          },
        }),
      ).unwrap();
    },
    [currentCoin, dispatch],
  );

  const handleCheckCustomDerivation = useCallback(() => {
    setShowAdvanceModal(false);
    setShowConfirmModal(true);
    isCustomDerivationClicked.current = true;
  }, []);

  const handleCustomDerivation = useCallback(() => {
    if (isCheckedStored) {
      setShowConfirmModal(true);
      isCustomDerivationClicked.current = true;
    } else {
      setShowAdvanceModal(true);
    }
  }, [isCheckedStored]);

  useLayoutEffect(() => {
    if (isDeriveAddressChain && !isImportWithPrivateKey) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{marginRight: 8}}>
            <Menu>
              <MenuTrigger>
                <EntypoIcon
                  size={24}
                  name={'dots-three-vertical'}
                  color={theme.font}
                />
              </MenuTrigger>
              <MenuOptions optionsContainerStyle={styles.optionsContainer}>
                <MenuOption onSelect={handleCustomDerivation}>
                  <View style={styles.optionMenu}>
                    <Text style={styles.optionText}>{'Custom Derivation'}</Text>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>
        ),
      });
    } else if (isBitcoin) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{marginRight: 8}}>
            <Menu>
              <MenuTrigger>
                <EntypoIcon
                  size={24}
                  name={'dots-three-vertical'}
                  color={theme.font}
                />
              </MenuTrigger>
              <MenuOptions optionsContainerStyle={styles.optionsContainer}>
                <MenuOption
                  onSelect={() => {
                    navigation.navigate('SelectUTXOsScreen', {
                      item: currentCoin,
                    });
                  }}>
                  <View style={styles.optionMenu}>
                    <Text style={styles.optionText}>{'Select UTXOs'}</Text>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDeriveAddressChain,
    isImportWithPrivateKey,
    navigation,
    theme.font,
    handleCustomDerivation,
  ]);

  if (!currentCoin) {
    return null;
  }
  return (
    <>
      <DokSafeAreaView
        style={styles.container}
        edges={['left', 'bottom', 'right']}>
        {isLoading ? (
          <Loading />
        ) : (
          <ScrollView
            contentContainerStyle={styles.containerContainerStyle}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            {isDeriveAddressChain &&
              !isImportWithPrivateKey &&
              !isAddMoreAddressPopupHide && (
                <View style={styles.syncView}>
                  <Text style={styles.syncTitle} numberOfLines={2}>
                    {'Do you want to allow more addresses under this wallet?'}
                  </Text>
                  <TouchableOpacity
                    style={styles.syncButton}
                    onPress={() => {
                      dispatch(addEVMAndTronDeriveAddresses());
                    }}>
                    <Text style={styles.syncButtonTitle}>{'Add'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      dispatch(setIsAddMoreAddressPopupHidden(true));
                    }}>
                    <MaterialCommunityIcons
                      name={'close'}
                      size={24}
                      color={theme.font}
                    />
                  </TouchableOpacity>
                </View>
              )}
            <View style={styles.box}>
              <View style={styles.coinList}>
                <View style={styles.coinIcon}>
                  {/* {currentList && (
                    <Text style={styles.currentIcon}>{currentCoin.icon}</Text>
                  )} */}
                  {currentCoin?.icon && (
                    <FastImage
                      source={{uri: item?.icon}}
                      resizeMode={'contain'}
                      style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: 30,
                      }}
                    />
                  )}
                </View>
                <View style={styles.coinBox}>
                  <Text style={{...styles.coinNumber, marginRight: 5}}>
                    {currentCoin.totalAmount}
                  </Text>
                  <Text style={styles.coinNumber}>{currentCoin?.symbol}</Text>
                  {isBitcoin && (
                    <Text
                      style={
                        styles.coinNumber
                      }>{` (${currentCoin?.chain_display_name})`}</Text>
                  )}
                </View>
                <Text style={styles.coinSum}>
                  {currencySymbol[localCurrency] || ''}
                  {currentCoin.totalCourse}
                </Text>
              </View>
              <View style={styles.btnList}>
                <TouchableOpacity
                  style={{...styles.btn, ...styles.shadow, marginRight: 20}}
                  onPress={() => {
                    if (isNativeCoinAvailable) {
                      dispatch(clearSelectedUTXOs());
                      navigation.navigate('SendFunds');
                    } else {
                      Toast.show({
                        type: 'errorToast',
                        text1: `Require ${currentCoin?.chain_display_name} chain`,
                        text2: `You need to add ${currentCoin?.chain_display_name} to send ${currentCoin?.name}`,
                      });
                    }
                  }}>
                  <SendIcon style={styles.icon} />
                  <Text style={styles.btnText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{...styles.btn, ...styles.shadow}}
                  onPress={() => navigation.navigate('RecieveFunds')}>
                  <RecIcon style={styles.icon} />
                  <Text style={styles.btnText}>Receive</Text>
                </TouchableOpacity>
              </View>

              {(isBitcoin || isDeriveAddressChain) &&
                Array.isArray(deriveAddresses) && (
                  <View>
                    <DokDropdown
                      placeholder={'SELECT ADDRESS:'}
                      title={'Select address'}
                      titleStyle={styles.addresTitle}
                      data={deriveAddresses}
                      onChangeValue={onChangeSelectedAddress}
                      value={address}
                    />
                  </View>
                )}
              <TouchableOpacity
                onPress={() => {
                  Clipboard.setString(address);
                  triggerHapticFeedbackLight();
                  Toast.show({
                    type: 'successToast',
                    text1: 'Address copied',
                  });
                }}
                style={styles.addresList}>
                <View style={styles.boxAdress}>
                  <Text style={styles.addresTitle}>Your Address:</Text>
                  <CopyIcon fill={theme.background} width={20} height={30} />
                </View>
                <Text style={styles.address}>{address}</Text>
              </TouchableOpacity>
              {!isPrivateKeyNotSupportedChain(currentCoin?.chain_name) && (
                <TouchableOpacity
                  onPress={() => {
                    setShowConfirmModal(true);
                    isCustomDerivationClicked.current = false;
                  }}
                  style={styles.addresList}>
                  <View style={styles.boxAdress}>
                    <Text style={styles.privateKeyTitle}>Private Key:</Text>

                    <CopyIcon fill={theme.background} width={20} height={30} />
                  </View>

                  <Text style={styles.privateKey}>
                    {
                      'Click here to copy the private key. Ensure that you keep your private key secure.'
                    }
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  ...styles.btn,
                  ...styles.shadow,
                  marginTop: 24,
                  width: '100%',
                }}
                onPress={() => {
                  navigation.navigate('TransactionList');
                }}>
                <Text style={styles.btnText}>{'Transaction History'}</Text>
              </TouchableOpacity>
              {isStaking ? (
                <TouchableOpacity
                  style={{
                    ...styles.btn,
                    ...styles.shadow,
                    width: '100%',
                  }}
                  onPress={() => {
                    navigation.navigate('StakingList');
                  }}>
                  <Text style={styles.btnText}>{'Staking'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        )}
      </DokSafeAreaView>
      <ModalConfirmTransaction
        hideModal={() => {
          setShowConfirmModal(false);
        }}
        visible={showConfirmModal}
        onSuccess={onSuccessOfPrivateKey}
      />
      <ModalAdvanceCustomDerivation
        isChecked={isCheckedStored}
        showConfirmModal={showConfirmModal}
        visible={showAdvanceModal}
        onPressYes={handleCheckCustomDerivation}
        onPressNo={() => {
          setShowAdvanceModal(false);
        }}
      />
    </>
  );
};

export default SendScreen;
