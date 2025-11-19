import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  SectionList,
} from 'react-native';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import myStyles from './CustomDerivationStyles';
import { ThemeContext } from '../../../../theme/ThemeContext';
import DokDropdown from '../../../../components/DokDropdown';
import { TextInput } from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentCoin } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  allDerivePath,
  customObj,
  getCustomizePublicAddress,
  isEVMChain,
  isValidDerivePath,
} from 'dok-wallet-blockchain-networks/helper';
import {
  addCustomDeriveAddress,
  deleteDeriveAddressInCurrentCoin,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import FastImage from '@d11/react-native-fast-image';
import DeriveAddressSheet from '../../../../components/DeriveAddressSheet';
import ModalConfirmTransaction from '../../../../components/ModalConfirmTransaction';
import Clipboard from '@react-native-clipboard/clipboard';
import { triggerHapticFeedbackLight } from '../../../../utils/hapticFeedback';
import Toast from 'react-native-toast-message';
import { DokSafeAreaView } from '../../../../components/DokSafeAreaView';

export const CustomDerivation = () => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const dispatch = useDispatch();
  const customDerivationSheetRef = useRef();
  const isDeleteRef = useRef(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const derivationData = useMemo(() => {
    const chainName = currentCoin?.chain_name;
    const convertedChainName = isEVMChain(chainName) ? 'ethereum' : chainName;
    const availableDerivePath = allDerivePath[convertedChainName] || [];
    const make50DerivePath = [];
    for (let i = 0; i < availableDerivePath.length; i++) {
      for (let j = 1; j <= 50; j++) {
        if (
          convertedChainName === 'ethereum' &&
          availableDerivePath[i]?.label?.includes('Ledger')
        ) {
          make50DerivePath.push({
            label: `Ledger (m/44'/60'/${j}'/0/0)`,
            value: `m/44'/60'/${j}'/0/0`,
          });
        } else if (
          convertedChainName === 'ethereum' &&
          availableDerivePath[i]?.label?.includes('Metamask')
        ) {
          make50DerivePath.push({
            label: `Metamask (m/44'/60'/0'/0/${j})`,
            value: `m/44'/60'/0'/0/${j}`,
          });
        } else if (
          convertedChainName === 'solana' &&
          availableDerivePath[i]?.label?.includes('Ledger')
        ) {
          make50DerivePath.push({
            label: `Ledger (m/44'/501'/${j}')`,
            value: `m/44'/501'/${j}'`,
          });
        } else if (
          convertedChainName === 'tron' &&
          availableDerivePath[i]?.label?.includes('Ledger')
        ) {
          make50DerivePath.push({
            label: `Ledger (m/44'/195'/${j}'/0/0)`,
            value: `m/44'/195'/${j}'/0/0`,
          });
        }
      }
    }
    return [customObj, ...make50DerivePath];
  }, [currentCoin?.chain_name]);

  const allDeriveAddress = useMemo(() => {
    const addresses = Array.isArray(currentCoin?.deriveAddresses)
      ? currentCoin?.deriveAddresses
      : [];

    const sortedAddresses = [...addresses].sort((a, b) => {
      // First, prioritize the active address (currently selected)
      if (a?.address === currentCoin?.address) {
        return -1;
      }
      if (b?.address === currentCoin?.address) {
        return 1;
      }

      // Then sort by derivation path numerically for better ordering
      const parseDerivationPath = derivePath => {
        if (!derivePath) {
          return [];
        }
        // Extract all numbers from the derivation path and convert to integers
        const numbers = derivePath.match(/\d+/g);
        return numbers ? numbers.map(num => parseInt(num, 10)) : [];
      };

      const pathA = parseDerivationPath(a?.derivePath);
      const pathB = parseDerivationPath(b?.derivePath);

      // Compare each number in the path from left to right
      const maxLength = Math.max(pathA.length, pathB.length);
      for (let i = 0; i < maxLength; i++) {
        const numA = pathA[i] || 0;
        const numB = pathB[i] || 0;

        if (numA !== numB) {
          return numA - numB;
        }
      }

      // If all numbers are equal, sort by string comparison as fallback
      const pathStringA = a?.derivePath || '';
      const pathStringB = b?.derivePath || '';
      return pathStringA.localeCompare(pathStringB);
    });

    return [
      {
        title: 'All accounts',
        data: sortedAddresses,
      },
    ];
  }, [currentCoin?.deriveAddresses, currentCoin?.address]);

  const {
    values,
    errors,
    setFieldError,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useFormik({
    enableReinitialize: true,
    initialValues: { selectedDerivationOptions: '', customDerivePath: '' },
    validationSchema: Yup.object().shape({
      selectedDerivationOptions: Yup.string().required(
        'Derivation Options is required',
      ),
    }),
    onSubmit: async submittedValue => {
      try {
        setIsSubmitting(true);
        const { selectedDerivationOptions, customDerivePath } = submittedValue;
        const chainName = isEVMChain(currentCoin?.chain_name)
          ? 'ethereum'
          : currentCoin?.chain_name;
        const derivePath =
          selectedDerivationOptions === 'custom'
            ? customDerivePath?.trim()?.replace(/[’`‘]/g, "'")
            : selectedDerivationOptions;
        if (isValidDerivePath(derivePath)) {
          const payload = {
            derivePath,
            chain_name: chainName,
          };
          await dispatch(addCustomDeriveAddress(payload)).unwrap();
        } else {
          setFieldError('customDerivePath', 'Invalid derive path');
        }
        setIsSubmitting(false);
      } catch (err) {
        setIsSubmitting(false);
        console.error('Error in submit custom derivation', err);
      }
    },
  });

  const isDisabled = !values?.selectedDerivationOptions;

  const HeaderComponent = useCallback(() => {
    return (
      <TouchableWithoutFeedback
        style={styles.container}
        onPress={() => {
          Keyboard.dismiss();
        }}>
        <View style={styles.mainContainer}>
          <View style={styles.formInput}>
            <DokDropdown
              titleStyle={{ color: theme.primary }}
              search={true}
              searchPlaceholder="Search..."
              placeholder={'Select Derivation'}
              title={'Select Derivation'}
              data={derivationData}
              onChangeValue={item => {
                setFieldValue('selectedDerivationOptions', item?.value);
              }}
              value={values.selectedDerivationOptions}
            />
            {values?.selectedDerivationOptions === 'custom' && (
              <>
                <TextInput
                  style={styles.input}
                  label="Derive path"
                  textColor={theme.font}
                  placeholder={'Enter derive path'}
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: errors.customDerivePath ? 'red' : '#989898',
                    },
                  }}
                  outlineColor={
                    touched.customDerivePath && errors.customDerivePath
                      ? 'red'
                      : '#989898'
                  }
                  activeOutlineColor={
                    touched.customDerivePath && errors.customDerivePath
                      ? 'red'
                      : theme.borderActiveColor
                  }
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  blurOnSubmit={false}
                  name="customDerivePath"
                  onChangeText={handleChange('customDerivePath')}
                  onBlur={handleBlur('customDerivePath')}
                  value={values.customDerivePath}
                />
                {errors.customDerivePath && touched.customDerivePath && (
                  <Text style={styles.textConfirm}>
                    {errors.customDerivePath}
                  </Text>
                )}
              </>
            )}
            <TouchableOpacity
              disabled={isDisabled || isSubmitting}
              style={[
                styles.button,
                {
                  backgroundColor:
                    isDisabled || isSubmitting ? theme.gray : theme.background,
                },
              ]}
              onPress={handleSubmit}>
              {isSubmitting ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Text style={styles.buttonTitle}>{'Add'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }, [
    derivationData,
    errors.customDerivePath,
    handleBlur,
    handleChange,
    handleSubmit,
    isDisabled,
    isSubmitting,
    setFieldValue,
    styles.button,
    styles.buttonTitle,
    styles.container,
    styles.formInput,
    styles.input,
    styles.mainContainer,
    styles.textConfirm,
    theme.background,
    theme.borderActiveColor,
    theme.font,
    theme.gray,
    theme.primary,
    touched.customDerivePath,
    values.customDerivePath,
    values.selectedDerivationOptions,
  ]);

  const renderHeader = useCallback(({ section: { title, data } }) => {
    if (!data?.length) {
      return null;
    }
    return (
      <View style={styles.listHeaderView}>
        <Text style={styles.listHeaderTitle}>{title}</Text>
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressDotIcon = useCallback(item => {
    customDerivationSheetRef.current &&
      customDerivationSheetRef.current.close();
    customDerivationSheetRef.current &&
      customDerivationSheetRef.current?.present();
    setSelectedItem(item);
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      return (
        <View style={styles.listItemView}>
          <FastImage
            source={{ uri: currentCoin?.icon }}
            style={styles.iconStyle}
            resizeMode={'contain'}
          />
          <View style={styles.textContainer}>
            <Text style={styles.derivePathStyle} numberOfLines={1}>
              {item?.derivePath || 'Default'}
              {currentCoin?.address === item?.address && (
                <Text style={styles.activeDerivePathStyle}>{' (ACTIVE)'}</Text>
              )}
            </Text>
            <Text style={styles.addressStyle} numberOfLines={1}>
              {getCustomizePublicAddress(item?.address)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onPressDotIcon(item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <EntypoIcon
              size={24}
              name={'dots-three-vertical'}
              color={theme.font}
            />
          </TouchableOpacity>
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCoin?.address, currentCoin?.icon],
  );

  const onSuccessPrivateKey = useCallback(() => {
    setShowConfirmModal(false);
    if (isDeleteRef.current) {
      if (currentCoin?.address === selectedItem?.address) {
        Toast.show({
          type: 'errorToast',
          text1: "Can't delete derive address",
          text2: "You can't delete the selected derive address",
        });
        return;
      }
      dispatch(
        deleteDeriveAddressInCurrentCoin({ address: selectedItem?.address }),
      );
    } else {
      Clipboard.setString(selectedItem?.privateKey);
      triggerHapticFeedbackLight();
      Toast.show({
        type: 'successToast',
        text1: 'Private key copied',
      });
    }
  }, [
    currentCoin?.address,
    dispatch,
    selectedItem?.address,
    selectedItem?.privateKey,
  ]);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <SectionList
          keyExtractor={(item, index) => item + index}
          sections={allDeriveAddress}
          renderItem={renderItem}
          keyboardShouldPersistTaps={'always'}
          renderSectionHeader={renderHeader}
          ListHeaderComponent={HeaderComponent()}
          stickySectionHeadersEnabled={true}
        />
        <DeriveAddressSheet
          bottomSheetRef={ref => (customDerivationSheetRef.current = ref)}
          onDismiss={() => {
            customDerivationSheetRef.current.close();
          }}
          selectedItem={selectedItem}
          onItemPress={key => {
            if (key === 'copy_private_key') {
              setShowConfirmModal(true);
              isDeleteRef.current = false;
            } else if (key === 'delete_derive_address') {
              setShowConfirmModal(true);
              isDeleteRef.current = true;
            }
          }}
        />
        <ModalConfirmTransaction
          hideModal={() => {
            setShowConfirmModal(false);
          }}
          visible={showConfirmModal}
          onSuccess={onSuccessPrivateKey}
        />
      </View>
    </DokSafeAreaView>
  );
};
