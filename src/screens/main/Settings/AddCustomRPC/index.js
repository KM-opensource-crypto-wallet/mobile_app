import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import myStyles from './AddCustomRPCStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {IS_ANDROID} from 'utils/dimensions';
import SelectInput from 'components/SelectInput';
import {CustomRPCList} from 'dok-wallet-blockchain-networks/helper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useDispatch, useSelector} from 'react-redux';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  addCustomRpc,
  updateCustomRpc,
} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSlice';
import WalletsPicker from 'components/WalletsPicker';
import {getRPCUrl} from 'dok-wallet-blockchain-networks/rpcUrls/rpcUrls';
import {validateRpcUrl} from 'dok-wallet-blockchain-networks/service/rpcService';
import {showToast} from 'utils/toast';
import {string, object, array} from 'yup';

const validationSchema = object().shape({
  networkInput: object().test(
    'is-selected',
    'Network is required',
    function (value) {
      return !!value?.value;
    },
  ),
  customRpcUrl: string()
    .required('Custom RPC URL is required')
    .url('Must be a valid URL'),
  wallets: array().test(
    'is-selected',
    'At least 1 wallet should be selected',
    function (value) {
      return value?.some(item => item?.isSelected);
    },
  ),
});

const AddCustomRPC = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const previousData = useMemo(() => {
    return {
      chain_name: route?.params?.chain_name,
      chain_display_name: route?.params?.chain_display_name,
      customRpcUrl: route?.params?.customRpcUrl,
      wallets: route?.params?.wallets,
    };
  }, [route?.params]);

  const dispatch = useDispatch();
  const allWallets = useSelector(selectAllWallets);
  const walletData = useMemo(() => {
    return allWallets.map(wallet => ({
      walletName: wallet?.walletName,
      clientId: wallet.clientId,
      isSelected: previousData?.wallets
        ? previousData?.wallets?.includes(wallet?.clientId)
        : true,
    }));
  }, [allWallets, previousData?.wallets]);

  const formikRef = useRef();
  const customRpcRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: previousData?.chain_name ? 'Edit Custom RPC' : 'Add Custom RPC',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = useCallback(
    async values => {
      const chain_name = values?.networkInput?.value;
      const chain_display_name = values?.networkInput?.label;
      const customRpcUrl = values?.customRpcUrl;
      const selectedWallets = values?.wallets?.filter(item => item.isSelected);
      if (chain_name && customRpcUrl) {
        const {isValid, error} = await validateRpcUrl(customRpcUrl);
        if (!isValid) {
          showToast({
            type: 'error',
            title: 'Invalid RPC URL',
            message: error,
          });
          return;
        }
        const payload = {
          chain_name,
          chain_display_name,
          customRpcUrl,
          wallets: selectedWallets?.map(item => item.clientId),
        };
        if (previousData?.chain_name) {
          dispatch(updateCustomRpc(payload));
        } else {
          dispatch(addCustomRpc(payload));
        }
        navigation.pop();
      }
    },
    [dispatch, navigation, previousData?.chain_name],
  );

  const toggleWalletSelect = useCallback(walletClientId => {
    const wallets = formikRef.current?.values?.wallets;
    formikRef?.current?.setFieldValue(
      'wallets',
      wallets.map(item => {
        if (item?.clientId === walletClientId) {
          return {...item, isSelected: !item?.isSelected};
        }
        return item;
      }),
    );
  }, []);

  const onSelectAll = useCallback(isSelected => {
    const wallets = formikRef.current?.values?.wallets;
    formikRef?.current?.setFieldValue(
      'wallets',
      wallets.map(item => ({...item, isSelected})),
    );
  }, []);

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      bounces={false}
      keyboardShouldPersistTaps={'always'}
      {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
      keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
      contentContainerStyle={styles.contentContainerStyle}>
      <TouchableWithoutFeedback
        style={styles.container}
        onPress={() => {
          Keyboard.dismiss();
        }}>
        <View style={styles.formInput}>
          <Text style={styles.listTitle}>
            Select a wallet and network, then enter a custom RPC URL to override
            the default endpoint for that chain.
          </Text>

          <Formik
            initialValues={{
              networkInput: previousData?.chain_name
                ? {
                    label: previousData?.chain_display_name,
                    value: previousData?.chain_name,
                  }
                : {},
              customRpcUrl: previousData?.customRpcUrl || '',
              wallets: walletData,
            }}
            innerRef={formikRef}
            validateOnMount={true}
            validationSchema={validationSchema}
            onSubmit={onSubmit}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isValid,
              setFieldValue,
            }) => {
              const errorNetworkInput = touched.networkInput
                ? errors.networkInput
                : '';
              const errorCustomRpcUrl = touched.customRpcUrl
                ? errors.customRpcUrl
                : '';
              const errorWallets = touched.wallets ? errors.wallets : '';
              const defaultRpcUrl = values?.networkInput?.value
                ? getRPCUrl(values.networkInput.value)
                : '';

              return (
                <View>
                  <SelectInput
                    setValue={value => {
                      setFieldValue('networkInput', value);
                    }}
                    form={'Network'}
                    number={'2'}
                    listData={CustomRPCList}
                    initialValue={values?.networkInput?.value}
                    error={errorNetworkInput}
                  />
                  {!!defaultRpcUrl && (
                    <>
                      <TextInput
                        style={styles.input}
                        textColor={theme.gray}
                        label="Default RPC URL"
                        theme={{
                          colors: {
                            onSurfaceVariant: theme.gray,
                          },
                        }}
                        outlineColor={theme.gray}
                        activeOutlineColor={theme.gray}
                        mode="outlined"
                        value={defaultRpcUrl}
                        editable={false}
                      />
                    </>
                  )}
                  <TextInput
                    ref={customRpcRef}
                    style={styles.input}
                    textColor={theme.font}
                    autoComplete={'off'}
                    autoCorrect={false}
                    {...(IS_ANDROID ? {keyboardType: 'visible-password'} : {})}
                    spellCheck={false}
                    label="Custom RPC URL"
                    placeholder={'Enter Custom RPC URL'}
                    theme={{
                      colors: {
                        onSurfaceVariant: errorCustomRpcUrl
                          ? 'red'
                          : theme.gray,
                      },
                    }}
                    outlineColor={errorCustomRpcUrl ? 'red' : theme.gray}
                    activeOutlineColor={errorCustomRpcUrl ? 'red' : theme.font}
                    autoCapitalize="none"
                    returnKeyType="return"
                    mode="outlined"
                    blurOnSubmit={false}
                    name="customRpcUrl"
                    onChangeText={handleChange('customRpcUrl')}
                    onBlur={handleBlur('customRpcUrl')}
                    value={values.customRpcUrl}
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                    }}
                  />
                  {!!errorCustomRpcUrl && (
                    <Text style={styles.textConfirm}>{errorCustomRpcUrl}</Text>
                  )}
                  <WalletsPicker
                    wallets={values.wallets}
                    onChange={toggleWalletSelect}
                    onSelectAll={onSelectAll}
                  />
                  {!!errorWallets && (
                    <Text style={[styles.textConfirm, {marginTop: 4}]}>
                      {errorWallets}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      !isValid && {
                        backgroundColor: theme.gray,
                      },
                    ]}
                    disabled={!isValid}
                    onPress={handleSubmit}>
                    <Text style={styles.buttonTitle}>Save</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          </Formik>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
};

export default AddCustomRPC;
