import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {TextInput, Searchbar, Switch} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddNotificationAlertStyles';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {refreshCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {getNotificationAlerts} from 'redux/notificationAlerts/notificationAlertsSelector';
import {
  addNotificationAlert,
  updateNotificationAlert,
} from 'redux/notificationAlerts/notificationAlertsSlice';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import {
  isBitcoinChain,
  isDeriveAddressSupportChain,
} from 'dok-wallet-blockchain-networks/helper';
import {v4} from 'uuid';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {IS_ANDROID} from 'utils/dimensions';
import OneSignalManager from 'utils/oneSignalManager';
import {showToast} from 'utils/toast';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FetchCoinLoader from 'components/FetchCoinLoader';

const STEP_TITLES = {
  1: 'Select Wallet',
  2: 'Select Coin',
  3: 'Select Address',
  4: 'Configure Alert',
};

const truncateAddress = address => {
  if (!address || address.length <= 14) {
    return address || '';
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const AddNotificationAlert = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  const existingAlert = route?.params?.alert;
  const isEditMode = !!existingAlert?.id;

  const allWallets = useSelector(selectAllWallets);
  const notificationAlerts = useSelector(getNotificationAlerts);

  const [step, setStep] = useState(isEditMode ? 4 : 1);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [coinSearchQuery, setCoinSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state for step 4
  const [minAmount, setMinAmount] = useState('');
  const [notifyOnReceive, setNotifyOnReceive] = useState(true);
  const [notifyOnSend, setNotifyOnSend] = useState(true);
  const [amountError, setAmountError] = useState('');
  const [toggleError, setToggleError] = useState('');

  // Track whether step 3 (address selection) was shown
  const showedStep3Ref = useRef(false);

  // Pre-populate for edit mode
  useEffect(() => {
    if (isEditMode && existingAlert) {
      const wallet = allWallets.find(
        w => w.clientId === existingAlert.walletClientId,
      );
      if (wallet) {
        setSelectedWallet(wallet);
        const coin = wallet.coins?.find(c => c._id === existingAlert.coinId);
        if (coin) {
          setSelectedCoin(coin);
        }
      }
      setSelectedAddress(existingAlert.address);
      setMinAmount(existingAlert.minAmount);
      setNotifyOnReceive(existingAlert.notifyOnReceive);
      setNotifyOnSend(existingAlert.notifyOnSend);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update header title per step
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode && step === 4 ? 'Edit Alert' : STEP_TITLES[step],
    });
  }, [step, navigation, isEditMode]);

  // Handle back navigation within wizard
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (step > 1 && !(isEditMode && step === 4)) {
        e.preventDefault();
        if (step === 4 && !showedStep3Ref.current) {
          setStep(2);
        } else {
          setStep(prev => prev - 1);
        }
      }
    });
    return unsubscribe;
  }, [navigation, step, isEditMode]);

  // Step 1: Select Wallet
  const onSelectWallet = useCallback(wallet => {
    setSelectedWallet(wallet);
    setSelectedCoin(null);
    setSelectedAddress('');
    setCoinSearchQuery('');
    showedStep3Ref.current = false;
    setStep(2);
  }, []);

  // Step 2: Select Coin
  const walletCoins = useMemo(() => {
    const coins = selectedWallet?.coins?.filter(coin => coin?.isInWallet) || [];
    if (!coinSearchQuery.trim()) {
      return coins;
    }
    const query = coinSearchQuery.toLowerCase();
    return coins.filter(
      coin =>
        coin.symbol?.toLowerCase()?.includes(query) ||
        coin.name?.toLowerCase()?.includes(query),
    );
  }, [selectedWallet, coinSearchQuery]);

  const onSelectCoin = useCallback(
    async coin => {
      setSelectedCoin(coin);
      setIsRefreshing(true);

      let finalCoin = coin;
      try {
        const result = await dispatch(
          refreshCurrentCoin({currentCoin: coin}),
        ).unwrap();
        if (result?.updatedCurrentCoin) {
          finalCoin = result.updatedCurrentCoin;
          setSelectedCoin(finalCoin);
        }
      } catch (e) {
        console.error('Error refreshing coin data:', e);
      }

      setIsRefreshing(false);

      const isBitcoin = isBitcoinChain(finalCoin.chain_name);
      const isDeriveChain = isDeriveAddressSupportChain(finalCoin.chain_name);
      const hasMultiple =
        (isBitcoin || isDeriveChain) &&
        Array.isArray(finalCoin.deriveAddresses) &&
        finalCoin.deriveAddresses.length > 1;
      showedStep3Ref.current = hasMultiple;
      if (hasMultiple) {
        setStep(3);
      } else {
        setSelectedAddress(finalCoin.address);
        setStep(4);
      }
    },
    [dispatch],
  );

  // Step 3: Select Address
  const onSelectAddress = useCallback(address => {
    setSelectedAddress(address);
    setStep(4);
  }, []);

  // Check for duplicate alert on same address
  const existingAlertForAddress = useMemo(() => {
    if (!selectedAddress) {
      return null;
    }
    return notificationAlerts.find(
      a =>
        a.address === selectedAddress &&
        a.coinId === selectedCoin?._id &&
        a.id !== existingAlert?.id,
    );
  }, [selectedAddress, selectedCoin, notificationAlerts, existingAlert?.id]);

  // Step 4: Validate and submit
  const validateForm = useCallback(() => {
    let isValid = true;

    if (
      !minAmount ||
      isNaN(parseFloat(minAmount)) ||
      parseFloat(minAmount) <= 0
    ) {
      setAmountError('Amount must be greater than 0');
      isValid = false;
    } else {
      setAmountError('');
    }

    if (!notifyOnReceive && !notifyOnSend) {
      setToggleError('At least one notification type must be enabled');
      isValid = false;
    } else {
      setToggleError('');
    }

    return isValid;
  }, [minAmount, notifyOnReceive, notifyOnSend]);

  const onSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      id: existingAlert?.id || v4(),
      walletClientId: selectedWallet.clientId,
      walletName: selectedWallet.walletName,
      coinId: selectedCoin._id,
      coinSymbol: selectedCoin.symbol,
      coinName: selectedCoin.name,
      coinIcon: selectedCoin.icon,
      chainName: selectedCoin.chain_name,
      chainDisplayName: selectedCoin.chain_display_name || '',
      coinType: selectedCoin.type,
      address: selectedAddress,
      minAmount,
      notifyOnReceive,
      notifyOnSend,
      createdAt: existingAlert?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (isEditMode) {
      dispatch(updateNotificationAlert(payload));
    } else {
      dispatch(addNotificationAlert(payload));
    }

    OneSignalManager.addTag(
      `alert_${payload.id}`,
      JSON.stringify({
        address: payload.address,
        chainName: payload.chainName,
        minAmount: payload.minAmount,
        receive: payload.notifyOnReceive,
        send: payload.notifyOnSend,
      }),
    );

    const toastDesc = `${payload.coinSymbol} on ${truncateAddress(
      payload.address,
    )} · Min ${payload.minAmount} ${payload.coinSymbol}`;
    showToast({
      type: 'successToast',
      title: isEditMode ? 'Alert updated' : 'Alert created',
      message: toastDesc,
    });

    navigation.pop();
  }, [
    validateForm,
    existingAlert,
    selectedWallet,
    selectedCoin,
    selectedAddress,
    minAmount,
    notifyOnReceive,
    notifyOnSend,
    isEditMode,
    dispatch,
    navigation,
  ]);

  // Step indicator dots
  const totalSteps = showedStep3Ref.current ? 4 : 3;
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({length: totalSteps}, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            step >= i + 1 ? styles.stepDotActive : styles.stepDotInactive,
          ]}
        />
      ))}
    </View>
  );

  // --- RENDER STEP 1: Wallet List ---
  const renderWalletItem = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => onSelectWallet(item)}>
        <MaterialCommunityIcons name={'wallet'} size={24} color={theme.font} />
        <View style={styles.flexOne}>
          <Text style={styles.listItemText}>{item.walletName}</Text>
          <Text style={styles.listItemSubtext}>
            {`${item.coins?.filter(c => c.isInWallet)?.length || 0} coins`}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={'chevron-right'}
          size={24}
          color={theme.gray}
          style={styles.listItemRight}
        />
      </TouchableOpacity>
    ),
    [onSelectWallet, styles, theme],
  );

  // --- RENDER STEP 2: Coin List ---
  const renderCoinItem = useCallback(
    ({item}) => {
      const isToken = item.type === 'token';
      const isBitcoin = isBitcoinChain(item.chain_name);
      return (
        <TouchableOpacity
          style={styles.coinRow}
          onPress={() => onSelectCoin(item)}>
          <CoinIcon item={item} />
          <View style={styles.coinInfo}>
            <View style={styles.coinSymbolRow}>
              <Text style={styles.coinSymbol}>{item.symbol}</Text>
              {(isToken || isBitcoin) && (
                <ChainItem chain_display_name={item.chain_display_name} />
              )}
            </View>
            <Text style={styles.coinName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={'chevron-right'}
            size={24}
            color={theme.gray}
          />
        </TouchableOpacity>
      );
    },
    [onSelectCoin, styles, theme],
  );

  // --- RENDER STEP 3: Address List ---
  const renderAddressItem = useCallback(
    ({item: deriveItem}) => {
      const isSelected = selectedAddress === deriveItem.address;
      return (
        <TouchableOpacity
          style={styles.addressRow}
          onPress={() => onSelectAddress(deriveItem.address)}>
          <View
            style={[
              styles.addressRadio,
              isSelected && styles.addressRadioSelected,
            ]}>
            {isSelected && <View style={styles.addressRadioInner} />}
          </View>
          <Text style={styles.addressText} numberOfLines={1}>
            {deriveItem.address}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedAddress, onSelectAddress, styles],
  );

  // --- RENDER STEP 4: Configure Form ---
  const renderConfigureStep = () => (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      bounces={false}
      keyboardShouldPersistTaps={'always'}
      {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
      keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
      contentContainerStyle={styles.contentContainerStyle}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.formContainer}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            {selectedCoin && (
              <View style={styles.summaryRow}>
                <CoinIcon item={selectedCoin} />
                <View style={styles.flexOne}>
                  <View style={styles.coinSymbolRow}>
                    <Text style={styles.coinSymbol}>{selectedCoin.symbol}</Text>
                    {(selectedCoin.type === 'token' ||
                      isBitcoinChain(selectedCoin.chain_name)) && (
                      <ChainItem
                        chain_display_name={selectedCoin.chain_display_name}
                      />
                    )}
                  </View>
                  <Text style={styles.coinName}>{selectedCoin.name}</Text>
                </View>
              </View>
            )}
            <View style={styles.summaryRowTop}>
              <Text style={styles.summaryLabel}>Wallet</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {selectedWallet?.walletName}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Address</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {truncateAddress(selectedAddress)}
              </Text>
            </View>
            {isEditMode && (
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setStep(1)}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Min Amount Input */}
          <TextInput
            style={styles.input}
            textColor={theme.font}
            label="Minimum Amount"
            placeholder={'Enter minimum amount'}
            keyboardType="decimal-pad"
            theme={{
              colors: {
                onSurfaceVariant: amountError ? 'red' : theme.gray,
              },
            }}
            outlineColor={amountError ? 'red' : theme.gray}
            activeOutlineColor={amountError ? 'red' : theme.font}
            returnKeyType="done"
            mode="outlined"
            value={minAmount}
            onChangeText={text => {
              setMinAmount(text);
              setAmountError('');
            }}
            right={
              <TextInput.Affix
                text={selectedCoin?.symbol || ''}
                textStyle={styles.affixText}
              />
            }
          />
          {!!amountError && (
            <Text style={styles.textConfirm}>{amountError}</Text>
          )}

          {/* Duplicate warning */}
          {existingAlertForAddress && (
            <Text style={styles.warningText}>
              An alert already exists for this address and coin
            </Text>
          )}

          {/* Notify on Receive Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.flexOne}>
              <Text style={styles.toggleLabel}>Notify on Receive</Text>
              <Text style={styles.toggleDesc}>
                Get notified when funds are received
              </Text>
            </View>
            <Switch
              value={notifyOnReceive}
              onValueChange={val => {
                setNotifyOnReceive(val);
                setToggleError('');
              }}
              trackColor={{false: 'gray', true: theme.background}}
              thumbColor={'white'}
              ios_backgroundColor="#E8E8E8"
            />
          </View>

          {/* Notify on Send Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.flexOne}>
              <Text style={styles.toggleLabel}>Notify on Send</Text>
              <Text style={styles.toggleDesc}>
                Get notified when funds are sent
              </Text>
            </View>
            <Switch
              value={notifyOnSend}
              onValueChange={val => {
                setNotifyOnSend(val);
                setToggleError('');
              }}
              trackColor={{false: 'gray', true: theme.background}}
              thumbColor={'white'}
              ios_backgroundColor="#E8E8E8"
            />
          </View>
          {!!toggleError && (
            <Text style={[styles.textConfirm, styles.toggleErrorText]}>
              {toggleError}
            </Text>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.button,
              existingAlertForAddress && !isEditMode && styles.buttonDisabled,
            ]}
            disabled={!!existingAlertForAddress && !isEditMode}
            onPress={onSubmit}>
            <Text style={styles.buttonTitle}>
              {isEditMode ? 'Update Alert' : 'Save Alert'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      {renderStepIndicator()}
      {step === 1 && (
        <FlatList
          data={allWallets}
          renderItem={renderWalletItem}
          keyExtractor={item => item.clientId}
          bounces={false}
        />
      )}
      {step === 2 && (
        <>
          <Searchbar
            placeholder="Search coins"
            value={coinSearchQuery}
            style={styles.searchInput}
            onChangeText={setCoinSearchQuery}
            inputStyle={styles.searchInputMinHeight}
          />
          <FlatList
            data={walletCoins}
            renderItem={renderCoinItem}
            keyExtractor={item => item._id}
            bounces={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {coinSearchQuery ? 'No coins found' : 'No coins in wallet'}
                </Text>
              </View>
            }
          />
        </>
      )}
      {step === 3 && (
        <FlatList
          data={selectedCoin?.deriveAddresses?.filter(d => d?.address) || []}
          renderItem={renderAddressItem}
          keyExtractor={(item, index) => item.address || String(index)}
          bounces={false}
        />
      )}
      {step === 4 && renderConfigureStep()}
      <FetchCoinLoader visible={isRefreshing} theme={theme} />
    </View>
  );
};

export default AddNotificationAlert;
