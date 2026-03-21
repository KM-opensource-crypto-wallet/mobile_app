import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import {v4 as UUIDV4} from 'uuid';
import {TextInput} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import CloseIcon from 'assets/images/icons/close.svg';
import QRCodeIcon from 'assets/images/sidebarIcons/QRCode.svg';

import myStyles from './ModalAddTokenStyles';
import SelectInput from 'components/SelectInput';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import {
  ModalAddTokenList,
  isEVMChain,
} from 'dok-wallet-blockchain-networks/helper';
import {addToken} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  selectCurrentWallet,
  selectWalletChainName,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {ThemeContext} from 'theme/ThemeContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  getCustomRPCWithData,
  selectAllCustomRpc,
} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSelectors';

const ModalAddToken = ({
  navigation,
  visible,
  hideModal,
  contractAddress,
  selectedNetwork,
}) => {
  const currentWallet = useSelector(selectCurrentWallet);
  const allCustomRPC = useSelector(selectAllCustomRpc);
  const {bottom} = useSafeAreaInsets();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme, bottom);

  const [tokenForm, setTokenForm] = useState({
    networkInput: selectedNetwork || null,
    contract_address: contractAddress || '',
    name: '',
    symbol: '',
    decimal: '',
    icon: '',
  });
  const [errors, setErrors] = useState({});
  const {contract_address, decimal, icon, name, networkInput, symbol} =
    tokenForm;
  const [possibleChain, setPossibleChain] = useState(ModalAddTokenList);

  const dispatch = useDispatch();
  const chainRef = useRef();
  const previousTimerRef = useRef(null);
  const keyboardHeight = useKeyboardHeight();

  const chain_name = useSelector(selectWalletChainName);
  const isValid = contract_address && networkInput && name && symbol && decimal;
  // -------------------------------------
  // Effects
  // -------------------------------------
  useEffect(() => {
    if (networkInput?.value) {
      const customRPC = getCustomRPCWithData(
        allCustomRPC,
        networkInput?.value,
        currentWallet?.clientId,
      );
      chainRef.current = getChain(
        networkInput?.value,
        currentWallet?.phrase,
        customRPC,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkInput]);

  useEffect(() => {
    if (visible && networkInput && contractAddress) {
      checkAddressData(contractAddress).then(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (chain_name) {
      const isEVM = isEVMChain(chain_name);
      if (isEVM) {
        setPossibleChain(ModalAddTokenList.filter(item => item.isEVM));
      } else {
        setPossibleChain(
          ModalAddTokenList.filter(item => item.value === chain_name),
        );
      }
    }
  }, [chain_name]);

  // -------------------------------------
  // Handlers
  // -------------------------------------
  const onFormSubmit = () => {
    if (name && contract_address && symbol) {
      const payload = {
        _id: UUIDV4(),
        chain_name: networkInput.value,
        chain_display_name: networkInput.label,
        chain_symbol: networkInput?.chain_symbol,
        type: networkInput?.type,
        token_type: networkInput?.token_type,
        name: name,
        symbol: symbol,
        contractAddress: contract_address,
        decimal: decimal,
        status: true,
        isInWallet: true,
      };
      if (icon) {
        payload.icon = icon;
      }
      dispatch(addToken(payload));
      hideModal(false);
    }
  };

  const showAddressError = useCallback(() => {
    setErrors(prev => ({
      ...prev,
      contract_address: `Invalid ${networkInput?.value?.toUpperCase()} contract address`,
    }));
    setTokenForm(prevState => ({
      ...prevState,
      name: '',
      decimal: '',
      symbol: '',
    }));
  }, [networkInput?.value, setErrors]);

  const checkAddressData = useCallback(
    async localContractAddress => {
      const isValidAddress = chainRef.current?.isValidAddress({
        address: localContractAddress,
      });
      if (isValidAddress) {
        const resp = await chainRef?.current?.getContract?.({
          contractAddress: localContractAddress,
        });
        if (resp?.name) {
          setTokenForm(prevState => ({...prevState, name: resp?.name}));
          setErrors({});
        } else {
          showAddressError();
        }
        if (resp?.decimals) {
          setTokenForm(prevState => ({
            ...prevState,
            decimal: resp?.decimals?.toString(),
          }));
        }
        if (resp?.symbol) {
          setTokenForm(prevState => ({...prevState, symbol: resp?.symbol}));
        }
        if (resp?.icon) {
          setTokenForm(prevState => ({...prevState, icon: resp?.icon}));
        }
      } else {
        showAddressError();
      }
    },
    [showAddressError],
  );

  useEffect(() => {
    if (contract_address) {
      setTokenForm(prevState => ({
        ...prevState,
        name: '',
        decimal: '',
        symbol: '',
        icon: '',
      }));
      checkAddressData(contract_address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkInput]);

  const onChangeNetwork = useCallback(value => {
    if (value?.value) {
      setTokenForm(prevState => ({...prevState, networkInput: value}));
    }
  }, []);

  // -------------------------------------
  // Render
  // -------------------------------------
  return (
    <Modal
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      visible={visible}
      onRequestClose={() => {
        hideModal(false);
      }}>
      <View
        style={{
          ...styles.centeredView,
          marginBottom: keyboardHeight ? keyboardHeight : 0,
        }}>
        <View style={styles.modalView}>
          <ScrollView keyboardShouldPersistTaps={'always'}>
            <View style={styles.modalHeader}>
              <Text style={styles.headerText}>Add Custom Token</Text>
              <TouchableOpacity
                onPress={() => {
                  hideModal(false);
                }}
                style={styles.closeBtn}>
                <CloseIcon fill={theme.font} width={13} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {/* --- Replace <Formik> with your formik hook usage --- */}
              <View>
                <SelectInput
                  setValue={onChangeNetwork}
                  form={'Network'}
                  number={'2'}
                  listData={possibleChain}
                  initialValue={networkInput}
                />
                <View style={styles.qrContainer}>
                  <TextInput
                    style={{...styles.input, width: '85%'}}
                    label="Address"
                    textColor={theme.font}
                    theme={{
                      colors: {
                        onSurfaceVariant: errors ? '#989898' : 'red',
                      },
                    }}
                    outlineColor={errors.contract_address ? 'red' : '#989898'}
                    activeOutlineColor={
                      errors.contract_address ? 'red' : theme.borderActiveColor
                    }
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                    }}
                    mode="outlined"
                    name="contract_address"
                    onChangeText={async value => {
                      setTokenForm(prevState => ({
                        ...prevState,
                        contract_address: value,
                      }));
                      checkAddressData(value).then(_ => {});
                    }}
                    value={contract_address}
                  />
                  <TouchableOpacity
                    style={styles.qrBtn}
                    onPress={() => {
                      hideModal(false);
                      navigation.navigate('Scanner', {
                        page: 'ManageCoins',
                        selectedNetwork: JSON.stringify(networkInput),
                      });
                    }}>
                    <QRCodeIcon fill={theme.backgroundColor} width={15} />
                  </TouchableOpacity>
                </View>
                {errors.contract_address && (
                  <Text style={styles.errorText}>
                    {errors.contract_address}
                  </Text>
                )}
                <TextInput
                  style={{...styles.input, marginBottom: 20}}
                  label="Name"
                  editable={false}
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                    },
                  }}
                  outlineColor={'#989898'}
                  activeOutlineColor={theme.borderActiveColor}
                  mode="outlined"
                  name="name"
                  value={name}
                />
                <View style={{...styles.qrContainer, marginBottom: 20}}>
                  <TextInput
                    style={{...styles.input, width: '45%'}}
                    label="Symbol"
                    editable={false}
                    theme={{
                      colors: {
                        onSurfaceVariant: '#989898',
                        primary: '#989898',
                      },
                    }}
                    outlineColor={'#989898'}
                    activeOutlineColor={theme.borderActiveColor}
                    mode="outlined"
                    name="symbol"
                    value={symbol}
                  />
                  <TextInput
                    style={{
                      ...styles.input,
                      width: '45%',
                    }}
                    editable={false}
                    label="Decimal"
                    theme={{
                      colors: {
                        onSurfaceVariant: '#989898',
                      },
                    }}
                    activeOutlineColor={theme.borderActiveColor}
                    mode="outlined"
                    name="decimal"
                    value={decimal}
                  />
                </View>
                <TouchableOpacity
                  disabled={!isValid}
                  style={[
                    styles.button,
                    {
                      backgroundColor: !isValid ? theme.gray : theme.background,
                    },
                  ]}
                  onPress={onFormSubmit}>
                  <Text style={styles.buttonTitle}>Add new Coin</Text>
                </TouchableOpacity>
              </View>
              {/* --- End of Formik hook usage --- */}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ModalAddToken;
