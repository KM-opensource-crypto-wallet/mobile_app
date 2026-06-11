import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import myStyles from './CreateStakingStyle';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import {useSelector, useDispatch, shallowEqual} from 'react-redux';
import {Portal, Provider} from 'react-native-paper';
import {getValidationSchemaForCreateStaking} from 'utils/validationSchema';
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
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import DokDropdown from 'components/DokDropdown';
import ValidatorOptionItem from 'components/ValidatorOptionItem';
import {
  fetchValidatorByChain,
  fetchStakingAllowance,
  executeApprove,
  setStakingLoading,
} from 'dok-wallet-blockchain-networks/redux/staking/stakingSlice';
import {
  getStakingLoading,
  getStakingValidatorsByChain,
} from 'dok-wallet-blockchain-networks/redux/staking/stakingSelectors';
import Loading from 'components/Loading';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import AllowanceInfoSheet from 'components/AllowanceInfoSheet';

const CreateStaking = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const localCurrency = useSelector(getLocalCurrency);
  const [maxAmount, setMaxAmount] = useState('0.00000');
  const allowanceSheetRef = useRef(null);
  const pendingFormValuesRef = useRef(null);

  const isEVMStaking = useMemo(
    () =>
      isEVMChain(currentCoin?.chain_name) &&
      !!currentCoin?.contractAddress &&
      !['tron', 'solana'].includes(currentCoin?.chain_name),
    [currentCoin?.chain_name, currentCoin?.contractAddress],
  );

  const availableAmount = useMemo(() => {
    const amount = currentCoin?.totalAmount || '0';
    const minBalance = currentCoin?.minimumBalance || '0';
    const localAvailableAmount = new BigNumber(amount).minus(
      new BigNumber(minBalance),
    );
    const zeroAmount = new BigNumber(0);
    return localAvailableAmount.gt(zeroAmount)
      ? localAvailableAmount.toString()
      : zeroAmount?.toString();
  }, [currentCoin]);

  const availableAmountCurrency = useMemo(() => {
    return multiplyBNWithFixed(availableAmount, currentCoin?.currencyRate, 2);
  }, [availableAmount, currentCoin?.currencyRate]);
  const isLoading = useSelector(getStakingLoading);
  const [approveLoading, setApproveLoading] = useState(false);
  const [pendingStakingProviderName, setPendingStakingProviderName] =
    useState(null);
  const [pendingAmount, setPendingAmount] = useState(null);
  const validators = useSelector(getStakingValidatorsByChain, shallowEqual);
  const floatingHeight = useFloatingHeight();
  const dispatch = useDispatch();
  const formikRef = useRef(null);
  const validatorList = useMemo(() => {
    return validators.map(item => ({
      label: item?.name,
      value: item?.validatorAddress,
      options: item,
    }));
  }, [validators]);

  const isValidatorSupport = useMemo(() => {
    return isValidatorSupportCreateStakingScreen(currentCoin?.chain_name);
  }, [currentCoin?.chain_name]);

  const isResourceSupport = useMemo(() => {
    return isHaveResourceTypeInCreateStakingScreen(currentCoin?.chain_name);
  }, [currentCoin?.chain_name]);

  const resourceData = useMemo(() => {
    return isResourceSupport ? resourcesData[currentCoin?.chain_name] : null;
  }, [isResourceSupport, currentCoin?.chain_name]);

  useEffect(() => {
    if (validatorList?.[0]) {
      formikRef?.current?.setFieldValue('validatorPubKey', validatorList?.[0]);
    }
  }, [validatorList]);

  useEffect(() => {
    if (new BigNumber(availableAmount).gt(new BigNumber(0))) {
      setMaxAmount(availableAmount);
    }
  }, [availableAmount]);

  useEffect(() => {
    if (isValidatorSupport) {
      dispatch(fetchValidatorByChain({chain_name: currentCoin?.chain_name}));
    } else {
      dispatch(setStakingLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToTransfer = useCallback(
    (values, allowanceType) => {
      dispatch(
        setCurrentTransferData({
          validatorPubKey: values?.validatorPubKey?.value,
          validatorName: values?.validatorPubKey?.label,
          stakingProviderName: values?.validatorPubKey?.label,
          currentCoin,
          amount: validateBigNumberStr(values?.amount),
          resourceType: values?.resourceType?.value,
          allowanceType: allowanceType || 'manual',
          isSendFunds: false,
        }),
      );
      dispatch(
        calculateEstimateFee({
          isFetchNonce: true,
          fromAddress: currentCoin?.address,
          amount: validateBigNumberStr(values?.amount),
          validatorPubKey: values?.validatorPubKey?.value,
          balance: availableAmount,
          isCreateStaking: true,
          resourceType: values?.resourceType?.value,
          stakingProviderName: values?.validatorPubKey?.label,
        }),
      );
      dispatch(setExchangeSuccess(false));
      navigation.navigate('Transfer', {
        fromScreen: 'Staking',
        isCreateStaking: true,
      });
    },
    [dispatch, currentCoin, availableAmount, navigation],
  );

  const handleSubmitForm = useCallback(
    async values => {
      if (isEVMStaking) {
        pendingFormValuesRef.current = values;
        setPendingStakingProviderName(values?.validatorPubKey?.label);
        setPendingAmount(values?.amount);
        try {
          const result = await dispatch(
            fetchStakingAllowance({
              stakingProviderName: values?.validatorPubKey?.label,
              amount: values?.amount,
            }),
          ).unwrap();
          if (result?.isApproved) {
            pendingFormValuesRef.current = null;
            navigateToTransfer(values, 'manual');
          } else {
            allowanceSheetRef.current?.present();
          }
        } catch (e) {
          console.warn('[CreateStaking] allowance fetch failed:', e?.message);
        }
        return;
      }
      navigateToTransfer(values);
    },
    [dispatch, isEVMStaking, navigateToTransfer],
  );

  const onAllowanceContinue = useCallback(
    async ({
      type: allowanceType,
      gasFee,
      estimateGas,
      maxPriorityFeePerGas,
      nonce,
    }) => {
      if (!pendingFormValuesRef.current) {
        return;
      }
      const formValues = pendingFormValuesRef.current;
      setApproveLoading(true);
      try {
        await dispatch(
          executeApprove({
            allowanceType,
            stakingProviderName: formValues?.validatorPubKey?.label,
            gasFee,
            estimateGas,
            maxPriorityFeePerGas,
            nonce,
          }),
        ).unwrap();
      } catch (e) {
        setApproveLoading(false);
        console.warn('[CreateStaking] allowance action failed:', e?.message);
        return;
      }
      setApproveLoading(false);
      allowanceSheetRef.current?.close();
      pendingFormValuesRef.current = null;
      navigateToTransfer(formValues, allowanceType);
    },
    [dispatch, navigateToTransfer],
  );

  if (isLoading) {
    return <Loading />;
  }
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
          <Formik
            innerRef={formikRef}
            enableReinitialize={true}
            initialValues={{
              amount: '',
              currencyAmount: '',
              validatorPubKey: validatorList?.[0] || null,
              resourceType: isResourceSupport ? resourceData[1] : null,
            }}
            validationSchema={getValidationSchemaForCreateStaking(
              currentCoin?.chain_name,
              availableAmount,
            )}
            onSubmit={handleSubmitForm}>
            {({
              handleBlur,
              handleSubmit,
              values,
              errors,
              isValid,
              setFieldValue,
            }) => (
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
                      <Text style={styles.title}>
                        Amount available for staking
                      </Text>
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
                              textColor={theme.font}
                              theme={{
                                colors: {
                                  onSurfaceVariant: errors ? theme.gray : 'red',
                                },
                              }}
                              outlineColor={errors.amount ? 'red' : theme.gray}
                              activeOutlineColor={
                                errors.amount ? 'red' : theme.font
                              }
                              autoCapitalize="none"
                              returnKeyType="next"
                              mode="outlined"
                              blurOnSubmit={false}
                              name="amount"
                              onChangeText={text => {
                                const tempValues = validateNumberInInput(
                                  text,
                                  currentCoin.decimal,
                                );
                                const tempAmount = multiplyBNWithFixed(
                                  tempValues,
                                  currentCoin?.currencyRate,
                                  2,
                                );
                                setFieldValue('currencyAmount', tempAmount);
                                setFieldValue('amount', tempValues);
                              }}
                              onBlur={handleBlur('amount')}
                              value={values.amount}
                              onSubmitEditing={handleSubmit}
                              keyboardType="decimal-pad"
                              type="number"
                            />
                            <TouchableOpacity
                              style={styles.btnMax}
                              hitSlop={{
                                top: 12,
                                left: 12,
                                right: 12,
                                bottom: 12,
                              }}
                              onPress={() => {
                                setFieldValue(
                                  'currencyAmount',
                                  availableAmountCurrency,
                                );
                                setFieldValue('amount', maxAmount + '');
                              }}>
                              <Text style={styles.btnText}>Max</Text>
                            </TouchableOpacity>
                          </View>
                          {errors.amount && (
                            <Text style={styles.textConfirm}>
                              {errors.amount}
                            </Text>
                          )}
                        </View>
                        <View style={styles.boxInput}>
                          <Text style={styles.listTitle}>
                            Fiat Staking Amount
                          </Text>
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
                                const tempValues = validateNumberInInput(
                                  text,
                                  2,
                                );
                                const tempAmount = new BigNumber(tempValues)
                                  .dividedBy(
                                    new BigNumber(currentCoin?.currencyRate),
                                  )
                                  .toFixed(Number(currentCoin?.decimal));
                                setFieldValue('currencyAmount', tempValues);
                                setFieldValue('amount', tempAmount);
                              }}
                              onBlur={handleBlur('currencyAmount')}
                              value={values.currencyAmount}
                              onSubmitEditing={handleSubmit}
                              keyboardType="decimal-pad"
                              type="number"
                            />
                            <TouchableOpacity
                              style={styles.btnMax}
                              hitSlop={{
                                top: 12,
                                left: 12,
                                right: 12,
                                bottom: 12,
                              }}
                              onPress={() => {
                                setFieldValue(
                                  'currencyAmount',
                                  availableAmountCurrency,
                                );
                                setFieldValue('amount', maxAmount + '');
                              }}>
                              <Text style={styles.btnText}>Max</Text>
                            </TouchableOpacity>
                          </View>
                          {errors.amount && (
                            <Text style={styles.textConfirm}>
                              {errors.amount}
                            </Text>
                          )}
                        </View>
                        {isValidatorSupport && (
                          <View style={styles.boxInput}>
                            <Text style={styles.listTitle}>Validator</Text>
                            <DokDropdown
                              titleStyle={{color: theme.primary}}
                              placeholder={'Select validator'}
                              title={''}
                              search={true}
                              data={validatorList}
                              onChangeValue={item => {
                                setFieldValue('validatorPubKey', item);
                              }}
                              value={values.validatorPubKey?.value}
                              renderItem={item => {
                                return (
                                  <ValidatorOptionItem
                                    item={item}
                                    currentCoin={currentCoin}
                                  />
                                );
                              }}
                            />
                          </View>
                        )}
                        {isResourceSupport && resourceData?.length && (
                          <View style={styles.boxInput}>
                            <Text style={styles.listTitle}>
                              {'Resource Type'}
                            </Text>
                            <DokDropdown
                              titleStyle={{color: theme.primary}}
                              placeholder={'Resource Type'}
                              title={''}
                              data={resourceData}
                              onChangeValue={item => {
                                setFieldValue('resourceType', item);
                              }}
                              value={values.resourceType?.value}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      disabled={!isValid}
                      style={{
                        ...styles.button,
                        backgroundColor: isValid
                          ? theme.background
                          : theme.gray,
                      }}
                      onPress={handleSubmit}>
                      <Text style={styles.buttonTitle}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            )}
          </Formik>
        </KeyboardAwareScrollView>
      </Portal>
      <AllowanceInfoSheet
        ref={allowanceSheetRef}
        tokenSymbol={currentCoin?.symbol}
        requiredAmount={formikRef?.current?.values?.amount}
        availableAmount={availableAmount}
        approveLoading={approveLoading}
        onContinue={onAllowanceContinue}
        chainSymbol={currentCoin?.chain_symbol}
        chainName={currentCoin?.chain_name}
        stakingProviderName={pendingStakingProviderName}
        amount={pendingAmount}
      />
    </Provider>
  );
};

export default CreateStaking;
