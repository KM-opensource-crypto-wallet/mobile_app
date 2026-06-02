import React, {useState, useContext, useMemo, useLayoutEffect} from 'react';
import myStyles from './WithdrawStakingStyle';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {Portal, Provider} from 'react-native-paper';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {IS_ANDROID, useFloatingHeight} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';
import {
  calculateEstimateFee,
  setCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {currencySymbol} from 'data/currency';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import BigNumber from 'bignumber.js';
import {
  isEVMChain,
  isHaveResourceTypeInCreateStakingScreen,
  isValidatorSupportCreateStakingScreen,
  multiplyBNWithFixed,
  resourcesData,
  validateBigNumberStr,
  validateNumber,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import StakingItem from 'components/StakingItem';
import DokDropdown from 'components/DokDropdown';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';

const disableTextInputChain = ['solana'];

const isDisableTextInput = chain_name =>
  disableTextInputChain.includes(chain_name);

const WithdrawStaking = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const selectedStake = route?.params?.selectedStake;
  const isWithdrawStaking = route?.params?.isWithdrawStaking;
  const isDeactivateStaking = route?.params?.isDeactivateStaking;
  const isStakingRewards = route?.params?.isStakingRewards;
  const hideResource = route?.params?.hideResource;

  const currentCoin = useSelector(selectCurrentCoin);
  const localCurrency = useSelector(getLocalCurrency);
  const isValidatorSupport = useMemo(() => {
    return isValidatorSupportCreateStakingScreen(currentCoin?.chain_name);
  }, [currentCoin?.chain_name]);

  const isEVMStaking =
    isDeactivateStaking && isEVMChain(currentCoin?.chain_name);

  const isResourceSupport = useMemo(() => {
    return isHaveResourceTypeInCreateStakingScreen(currentCoin?.chain_name);
  }, [currentCoin?.chain_name]);

  const resourceData = useMemo(() => {
    return isResourceSupport ? resourcesData[currentCoin?.chain_name] : null;
  }, [isResourceSupport, currentCoin?.chain_name]);

  const stakingProviderList = useMemo(() => {
    if (!isEVMStaking) {
      return [];
    }
    const staking = Array.isArray(currentCoin?.staking)
      ? currentCoin.staking
      : [];
    return staking.map(item => ({
      label: item?.validatorInfo?.name,
      value: item?.validatorInfo?.name,
      stakedAmount: item?.stakedAmount,
      fiatAmount: multiplyBNWithFixed(
        item?.stakedAmount,
        currentCoin?.currencyRate,
        2,
      ),
    }));
  }, [isEVMStaking, currentCoin?.staking, currentCoin?.currencyRate]);

  const [selectedProvider] = useState(
    stakingProviderList.find(
      p =>
        p.value === selectedStake?.providerName ||
        p.value === selectedStake?.validatorInfo?.name,
    ) ||
      stakingProviderList[0] ||
      null,
  );

  const [state, setState] = useState({
    resourceType:
      isResourceSupport && isDeactivateStaking ? resourceData?.[1] : null,
    amount: selectedStake?.stakedAmount || selectedStake?.amount || '0',
    currencyAmount: selectedStake?.fiatAmount || '0',
    errors: {},
  });
  const {amount, currencyAmount, errors, resourceType} = state;
  const availableAmount = useMemo(() => {
    if (isEVMStaking) {
      return selectedProvider?.stakedAmount || '0';
    }
    return selectedStake?.amount?.toString()
      ? selectedStake?.amount?.toString()
      : state?.resourceType?.value === 'ENERGY'
      ? currentCoin?.energyBalance
      : currentCoin?.bandwidthBalance;
  }, [
    isEVMStaking,
    selectedProvider?.stakedAmount,
    currentCoin?.bandwidthBalance,
    currentCoin?.energyBalance,
    selectedStake?.amount,
    state.resourceType?.value,
  ]);

  const availableAmountCurrency = useMemo(() => {
    if (selectedStake?.fiatAmount?.toString()) {
      return selectedStake?.fiatAmount?.toString();
    } else {
      const energyBalanceBN = new BigNumber(currentCoin?.energyBalance || 0);
      const bandwidthBalanceBN = new BigNumber(
        currentCoin?.bandwidthBalance || 0,
      );
      const currencyRateBN = new BigNumber(currentCoin?.currencyRate || 0);
      return currencyRateBN
        .multipliedBy(
          state.resourceType?.value === 'ENERGY'
            ? energyBalanceBN
            : bandwidthBalanceBN,
        )
        .toFixed(2);
    }
  }, [
    currentCoin?.bandwidthBalance,
    currentCoin?.currencyRate,
    currentCoin?.energyBalance,
    selectedStake?.fiatAmount,
    state.resourceType?.value,
  ]);
  const disableTextInput =
    isDisableTextInput(currentCoin?.chain_name) || !isDeactivateStaking;

  const floatingHeight = useFloatingHeight();
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    if (isWithdrawStaking) {
      navigation.setOptions({
        title: 'Withdraw Staking',
      });
    } else if (isDeactivateStaking) {
      navigation.setOptions({
        title: 'Deactivate Staking',
      });
    } else if (isStakingRewards) {
      navigation.setOptions({
        title: 'Claim Staking Rewards',
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithdrawStaking, isDeactivateStaking, isStakingRewards]);

  const handleSubmitForm = async () => {
    const localErrors = checkError(amount, currencyAmount);
    if (Object.keys(localErrors).length === 0) {
      dispatch(
        setCurrentTransferData({
          validatorPubKey: selectedStake?.validator_address,
          stakingAddress: selectedStake?.staking_address,
          validatorName: selectedStake?.validatorInfo?.name,
          stakingProviderName: isEVMStaking
            ? selectedProvider?.value || selectedStake?.validatorInfo?.name
            : selectedStake?.providerName || selectedStake?.validatorInfo?.name,
          currentCoin,
          amount: validateBigNumberStr(amount),
          resourceType: resourceType?.value,
          isSendFunds: false,
        }),
      );
      dispatch(
        calculateEstimateFee({
          isFetchNonce: true,
          fromAddress: currentCoin?.address,
          contractAddress:
            selectedStake?.validator_address || currentCoin?.contractAddress,
          amount: validateBigNumberStr(amount),
          tokenDecimals: currentCoin?.decimal,
          validatorPubKey: selectedStake?.validator_address,
          stakingAddress: selectedStake?.staking_address,
          isWithdrawStaking: isWithdrawStaking,
          isDeactivateStaking: isDeactivateStaking,
          isStakingRewards: isStakingRewards,
          resourceType: resourceType?.value,
          stakingProviderName: isEVMStaking
            ? selectedProvider?.value || selectedStake?.validatorInfo?.name
            : selectedStake?.providerName || selectedStake?.validatorInfo?.name,
        }),
      );
      dispatch(setExchangeSuccess(false));
      navigation.navigate('Transfer', {
        fromScreen: 'Staking',
        isDeactivateStaking,
        isWithdrawStaking,
        isStakingRewards,
      });
    } else {
      setState({
        ...state,
        errors: localErrors,
      });
    }
  };

  const checkError = (localAmount, localCurrencyAmount) => {
    const error = {};
    const numLocalAmount = validateNumber(localAmount);
    const numLocalCurrencyAmount = validateNumber(localCurrencyAmount);

    if (
      !numLocalAmount ||
      !numLocalCurrencyAmount ||
      numLocalAmount < 0 ||
      numLocalCurrencyAmount < 0
    ) {
      if (!numLocalAmount || numLocalAmount < 0) {
        error.amount = 'Amount is required and must be a positive number';
      }
      if (numLocalCurrencyAmount < 0) {
        error.currencyAmount =
          'Currency Amount is required and must be a positive number';
      }
      return error;
    }
    const amountBN = new BigNumber(localAmount || 0);
    const currencyAmountBN = new BigNumber(localCurrencyAmount || 0);
    const availableAmountBN = new BigNumber(availableAmount || 0);
    const availableCurrencyAmountBN = new BigNumber(localCurrencyAmount || 0);
    if (amountBN.gt(availableAmountBN)) {
      error.amount = 'Amount is greater than available amount';
    }
    if (currencyAmountBN.gt(availableCurrencyAmountBN)) {
      error.currencyAmount = 'Currency Amount is greater than available amount';
    }
    return error;
  };
  const amountBN = new BigNumber(amount);
  const availableAmountBN = new BigNumber(availableAmount);
  const isValid = validateNumber(amount) && amountBN.lte(availableAmountBN);

  return (
    <Provider>
      <Portal>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          bounces={false}
          keyboardShouldPersistTaps={'always'}
          {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
          enableResetScrollToCoords={false}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          contentContainerStyle={styles.contentContainerStyle}>
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
            }}>
            <View style={{flex: 1}}>
              <View
                style={{
                  ...styles.container,
                  paddingVertical: floatingHeight > 400 ? 40 : 10,
                }}>
                <View style={styles.formInput}>
                  <Text style={styles.title}>Staking Amount</Text>
                  <View style={styles.box}>
                    <Text style={styles.boxTitle}>{availableAmount}</Text>
                    <Text style={styles.boxTitle}>
                      {' ' + currentCoin?.symbol}
                    </Text>
                  </View>
                  <View style={styles.box}>
                    <Text style={styles.boxBalance}>
                      {currencySymbol[localCurrency] || ''}
                      {availableAmountCurrency}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                    }}>
                    <View style={styles.boxInput}>
                      <Text style={styles.listTitle}>Staking Amount</Text>
                      <View style={styles.inputView}>
                        <TextInput
                          style={styles.input}
                          label="Enter amount for staking"
                          theme={{
                            colors: {
                              onSurfaceVariant: errors ? theme.gray : 'red',
                            },
                          }}
                          outlineColor={errors.amount ? 'red' : theme.gray}
                          activeOutlineColor={
                            errors.amount ? 'red' : theme.font
                          }
                          textColor={theme.font}
                          autoCapitalize="none"
                          returnKeyType="next"
                          mode="outlined"
                          blurOnSubmit={false}
                          editable={!disableTextInput}
                          name="amount"
                          onChangeText={text => {
                            const tempValues = validateNumberInInput(
                              text,
                              currentCoin?.decimal,
                            );
                            const tempAmount = multiplyBNWithFixed(
                              tempValues,
                              currentCoin?.currencyRate,
                              2,
                            );
                            const localErrors = checkError(
                              tempValues,
                              tempAmount,
                            );
                            setState({
                              ...state,
                              currencyAmount: tempAmount,
                              amount: tempValues,
                              errors: localErrors,
                            });
                          }}
                          value={amount}
                          keyboardType="decimal-pad"
                          type="number"
                        />
                        <TouchableOpacity
                          disabled={disableTextInput}
                          style={styles.btnMax}
                          hitSlop={{
                            top: 12,
                            left: 12,
                            right: 12,
                            bottom: 12,
                          }}
                          onPress={() => {
                            setState({
                              ...state,
                              currencyAmount: availableAmountCurrency,
                              amount: availableAmount,
                            });
                          }}>
                          <Text style={styles.btnText}>Max</Text>
                        </TouchableOpacity>
                      </View>
                      {errors.amount && (
                        <Text style={styles.textConfirm}>{errors.amount}</Text>
                      )}
                    </View>
                    <View style={styles.boxInput}>
                      <Text style={styles.listTitle}>Fiat Staking Amount</Text>
                      <View style={styles.inputView}>
                        <TextInput
                          style={styles.input}
                          label={`Enter ${localCurrency} amount for staking`}
                          theme={{
                            colors: {
                              onSurfaceVariant: !errors?.currencyAmount
                                ? theme.gray
                                : 'red',
                            },
                          }}
                          editable={!disableTextInput}
                          outlineColor={
                            errors.currencyAmount ? 'red' : theme.gray
                          }
                          activeOutlineColor={
                            errors.currencyAmount ? 'red' : theme.font
                          }
                          autoCapitalize="none"
                          returnKeyType="next"
                          mode="outlined"
                          blurOnSubmit={false}
                          name="currencyAmount"
                          onChangeText={text => {
                            const tempValues = validateNumberInInput(text, 2);
                            const tempAmount = new BigNumber(tempValues)
                              .dividedBy(
                                new BigNumber(currentCoin?.currencyRate),
                              )
                              .toFixed(
                                currentCoin?.decimal
                                  ? Number(currentCoin?.decimal)
                                  : 8,
                              );
                            const localErrors = checkError(
                              tempAmount,
                              tempValues,
                            );
                            setState({
                              ...state,
                              amount: tempAmount,
                              currencyAmount: tempValues,
                              errors: localErrors,
                            });
                          }}
                          value={currencyAmount}
                          keyboardType="decimal-pad"
                          type="number"
                        />
                        <TouchableOpacity
                          disabled={disableTextInput}
                          style={styles.btnMax}
                          hitSlop={{
                            top: 12,
                            left: 12,
                            right: 12,
                            bottom: 12,
                          }}
                          onPress={() => {
                            setState({
                              ...state,
                              amount: availableAmount,
                              currencyAmount: availableAmountCurrency,
                            });
                          }}>
                          <Text style={styles.btnText}>Max</Text>
                        </TouchableOpacity>
                      </View>
                      {errors.currencyAmount && (
                        <Text style={styles.textConfirm}>
                          {errors.currencyAmount}
                        </Text>
                      )}
                    </View>
                    {isEVMStaking && stakingProviderList.length > 0 && (
                      <View style={styles.boxInput}>
                        <Text style={styles.listTitle}>Staking Provider</Text>
                        <StakingItem item={selectedStake} isWithdraw={false} />
                      </View>
                    )}
                    {isValidatorSupport && !isEVMStaking && (
                      <View style={styles.boxInput}>
                        <Text style={styles.listTitle}>Validator</Text>
                        <StakingItem
                          item={selectedStake}
                          isWithdraw={false}
                          showReward={false}
                        />
                      </View>
                    )}
                    {isResourceSupport && !hideResource && (
                      <View style={styles.boxInput}>
                        <Text style={styles.listTitle}>{'Resource Type'}</Text>
                        <DokDropdown
                          titleStyle={{color: theme.primary}}
                          placeholder={'Resource Type'}
                          title={''}
                          data={resourceData}
                          onChangeValue={item => {
                            setState({...state, resourceType: item});
                          }}
                          value={resourceType?.value}
                        />
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  disabled={!isValid}
                  style={{
                    ...styles.button,
                    backgroundColor: isValid ? theme.background : theme.gray,
                  }}
                  onPress={handleSubmitForm}>
                  <Text style={styles.buttonTitle}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      </Portal>
    </Provider>
  );
};

export default WithdrawStaking;
