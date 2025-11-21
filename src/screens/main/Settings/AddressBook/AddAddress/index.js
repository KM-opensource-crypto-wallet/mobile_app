import React, {
  useCallback,
  useContext,
  useEffect,
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
import myStyles from './AddAddressStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {IS_ANDROID} from 'utils/dimensions';
import SelectInput from 'components/SelectInput';
import {
  isEqualArray,
  isEVMChain,
  PrivateKeyList,
} from 'dok-wallet-blockchain-networks/helper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {useDispatch, useSelector} from 'react-redux';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import WalletsPicker from 'components/WalletsPicker';
import Checkbox from 'components/Checkbox';
import {getAddressBook} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSelector';
import {v4} from 'uuid';
import {
  addAddressBook,
  updateAddressBook,
} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSlice';
import {string, object, array, boolean} from 'yup';

const validationSchema = (previousObj, existedNames) => {
  return object().shape({
    address: string().required('Address is required'),
    name: string()
      .notOneOf(existedNames, 'This name is already existed.')
      .required('Name is required')
      .max(50, 'Name should be maximum 50 characters'),
    label: string().optional().max(50, 'Label should be maximum 50 characters'),
    networkInput: object().test(
      'is-selected',
      'Network is required',
      function (value) {
        return !!value?.value;
      },
    ),
    isEVMCheckbox: boolean().optional(),
    wallets: array().test(
      'is-selected',
      'At least 1 wallets should be selected',
      function (value) {
        return value?.some(item => item?.isSelected);
      },
    ),
    customField: object().test(
      'is-changed',
      'At least one field must be different from the previous values',
      function () {
        if (!previousObj?.id) {
          return true;
        }
        const {
          name,
          address,
          label = '',
          wallets,
          networkInput,
          isEVMCheckbox,
        } = this.parent;

        const tempWallets = wallets
          ?.filter(item => item?.isSelected)
          .map(item => item?.clientId);
        return (
          name !== previousObj.name ||
          label !== previousObj.label ||
          address !== previousObj.address ||
          isEVMCheckbox !== previousObj.isEVM ||
          networkInput?.value !== previousObj.chain_name ||
          !isEqualArray(tempWallets, previousObj?.wallets)
        );
      },
    ),
  });
};

const AddAddress = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const previousData = useMemo(() => {
    return {
      id: route?.params?.id,
      name: route?.params?.name,
      label: route?.params?.label,
      chain_name: route?.params?.chain_name,
      chain_display_name: route?.params?.chain_display_name,
      isEVM: route?.params?.isEVM,
      address: route?.params?.address,
      wallets: route?.params?.wallets,
    };
  }, [route?.params]);

  const allWallets = useSelector(selectAllWallets);
  const walletData = useMemo(() => {
    return allWallets.map(wallet => {
      return {
        walletName: wallet?.walletName,
        clientId: wallet.clientId,
        isSelected: previousData?.wallets
          ? previousData?.wallets?.includes(wallet?.clientId)
          : true,
      };
    });
  }, [allWallets, previousData?.wallets]);

  const formikRef = useRef();
  const inputNameRef = useRef(null);
  const qrAddress = route?.params?.qrAddress;
  const addressBook = useSelector(getAddressBook);
  const existedNames = useMemo(() => {
    const tempAddressBook = previousData?.name
      ? addressBook?.filter(item => item.name !== previousData?.name)
      : addressBook;
    return tempAddressBook.map(item => item?.name);
  }, [addressBook, previousData?.name]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (qrAddress) {
      formikRef?.current?.setFieldValue('address', qrAddress?.toString());
    }
  }, [qrAddress]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: previousData?.id ? 'Edit Address' : 'Add Address',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = useCallback(
    async values => {
      try {
        const chain_name = values?.networkInput?.value;
        const chain_display_name = values?.networkInput?.label;
        const isEvm = isEVMChain(chain_name);
        const address = values?.address;
        const selectedWallets = values?.wallets?.filter(
          item => item.isSelected,
        );
        const name = values?.name;
        const label = values?.label || '';
        if (chain_name && address && name) {
          const chain = getChain(chain_name);
          const isValid = await chain.isValidAddress({address});
          if (isValid) {
            const payload = {
              id: previousData?.id || v4(),
              name,
              address,
              chain_name,
              isEVM: isEvm && values?.isEVMCheckbox,
              wallets: selectedWallets?.map(item => item.clientId),
              label,
              chain_display_name,
            };
            previousData?.id
              ? dispatch(updateAddressBook(payload))
              : dispatch(addAddressBook(payload));
            navigation.pop();
          } else {
            formikRef.current?.setFieldError('address', 'Invalid address');
          }
        }
      } catch (err) {
        if (err.stack) {
          console.error(`in importWallet: ${JSON.stringify(err)}`);
          formikRef.current?.setErrors({address: 'Invalid address'});
        }
      }
    },
    [dispatch, navigation, previousData?.id],
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
      wallets.map(item => {
        return {...item, isSelected};
      }),
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
            Select a chain, enter your wallet address, and assign a name to it.
            This will help you easily identify and use the address when sending
            cryptocurrency.
          </Text>

          <Formik
            initialValues={{
              address: previousData?.address || qrAddress || '',
              name: previousData?.name || '',
              label: previousData?.label || '',
              networkInput: previousData?.chain_name
                ? {
                    label: previousData?.chain_display_name,
                    value: previousData?.chain_name,
                  }
                : {},
              isEVMCheckbox:
                typeof previousData?.isEVM === 'boolean'
                  ? previousData?.isEVM
                  : true,
              wallets: walletData,
            }}
            innerRef={formikRef}
            validateOnMount={true}
            validationSchema={validationSchema(previousData, existedNames)}
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
              const isEvm = isEVMChain(values?.networkInput?.value);
              const errorName = touched.name ? errors.name : '';
              const errorAddress = touched.address ? errors.address : '';
              const errorNetworkInput = touched.networkInput
                ? errors.networkInput
                : '';
              const errorWallets = touched.wallets ? errors.wallets : '';

              return (
                <View>
                  <SelectInput
                    setValue={value => {
                      setFieldValue('networkInput', value);
                    }}
                    form={'Network'}
                    number={'2'}
                    listData={PrivateKeyList}
                    initialValue={values?.networkInput?.value}
                    error={errorNetworkInput}
                  />
                  {isEvm && (
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => {
                        setFieldValue('isEVMCheckbox', !values?.isEVMCheckbox);
                      }}
                      style={styles.checkboxView}>
                      <Checkbox
                        checked={values?.isEVMCheckbox}
                        onChange={() => {
                          setFieldValue(
                            'isEVMCheckbox',
                            !values?.isEVMCheckbox,
                          );
                        }}
                        customStyle={{marginBottom: 0}}
                      />
                      <Text style={styles.checkboxDesc}>
                        Available for all EVM chains
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TextInput
                    style={styles.input}
                    textColor={theme.font}
                    autoComplete={'off'}
                    autoCorrect={false}
                    {...(IS_ANDROID ? {keyboardType: 'visible-password'} : {})}
                    spellCheck={false}
                    label="Address"
                    placeholder={'Enter Address'}
                    theme={{
                      colors: {
                        onSurfaceVariant: errorAddress ? 'red' : theme.gray,
                      },
                    }}
                    outlineColor={errorAddress ? 'red' : theme.gray}
                    activeOutlineColor={errorAddress ? 'red' : theme.font}
                    autoCapitalize="none"
                    returnKeyType="next"
                    mode="outlined"
                    blurOnSubmit={false}
                    name="address"
                    onChangeText={handleChange('address')}
                    onBlur={handleBlur('address')}
                    value={values.address}
                    onSubmitEditing={() => {
                      inputNameRef?.current?.focus?.();
                    }}
                    right={
                      <TextInput.Icon
                        style={styles.scan}
                        icon="qrcode-scan"
                        iconColor={theme.backgroundColor}
                        size={15}
                        onPress={() => {
                          navigation.navigate('Scanner', {
                            page: 'AddAddress',
                          });
                        }}
                      />
                    }
                  />
                  {!!errorAddress && (
                    <Text style={styles.textConfirm}>{errorAddress}</Text>
                  )}
                  <TextInput
                    ref={inputNameRef}
                    style={styles.input}
                    textColor={theme.font}
                    {...(IS_ANDROID ? {keyboardType: 'visible-password'} : {})}
                    label="Name"
                    placeholder={'Enter Name'}
                    theme={{
                      colors: {
                        onSurfaceVariant: errorName ? 'red' : theme.gray,
                      },
                    }}
                    maxLength={50}
                    outlineColor={errorName ? 'red' : theme.gray}
                    activeOutlineColor={errorName ? 'red' : theme.font}
                    returnKeyType="return"
                    mode="outlined"
                    blurOnSubmit={false}
                    name="name"
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    value={values.name}
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                    }}
                  />
                  {!!errorName && (
                    <Text style={styles.textConfirm}>{errorName}</Text>
                  )}
                  <TextInput
                    style={styles.input}
                    textColor={theme.font}
                    label="Optional Label"
                    placeholder={'Enter Label'}
                    theme={{
                      colors: {
                        onSurfaceVariant: errors.label ? 'red' : theme.gray,
                      },
                    }}
                    outlineColor={errors.label ? 'red' : theme.gray}
                    activeOutlineColor={errors.label ? 'red' : theme.font}
                    returnKeyType="return"
                    mode="outlined"
                    blurOnSubmit={false}
                    name="label"
                    onChangeText={handleChange('label')}
                    onBlur={handleBlur('label')}
                    value={values.label}
                    maxLength={50}
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                    }}
                  />
                  {errors.label && touched.label && (
                    <Text style={styles.textConfirm}>{errors.label}</Text>
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

export default AddAddress;
