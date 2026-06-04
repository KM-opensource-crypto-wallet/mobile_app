import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  SectionList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import myStyles from './CustomDerivationStyles';
import {ThemeContext} from 'theme/ThemeContext';
import DokDropdown from 'components/DokDropdown';
import Checkbox from 'components/Checkbox';
import {TextInput} from 'react-native-paper';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {useDispatch, useSelector} from 'react-redux';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  allDerivePath,
  customObj,
  getCustomizePublicAddress,
  isBitcoinChain,
  isEVMChain,
  isValidDerivePath,
  validateSupportedChain,
} from 'dok-wallet-blockchain-networks/helper';
import {
  addCustomDeriveAddress,
  deleteDeriveAddressInCurrentCoin,
  deleteMultipleDeriveAddressesInCurrentCoin,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import FastImage from '@d11/react-native-fast-image';
import DeriveAddressSheet from 'components/DeriveAddressSheet';
import ModalConfirmTransaction from 'components/ModalConfirmTransaction';
import Clipboard from '@react-native-clipboard/clipboard';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import Toast from 'react-native-toast-message';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const DERIVATION_CONFIG = {
  ethereum: {
    Ledger: j => `m/44'/60'/${j}'/0/0`,
    Metamask: j => `m/44'/60'/0'/0/${j}`,
  },
  solana: {
    Ledger: j => `m/44'/501'/${j}'`,
  },
  tron: {
    Ledger: j => `m/44'/195'/${j}'/0/0`,
  },
  bitcoin: {
    Ledger: j => `m/84'/0'/${j}'/0/0`,
  },
  bitcoin_segwit: {
    Ledger: j => `m/49'/0'/${j}'/0/0`,
  },
  bitcoin_legacy: {
    Ledger: j => `m/44'/0'/${j}'/0/0`,
  },
};

const generatePaths = (chain, label) => {
  const config = DERIVATION_CONFIG[chain];
  if (!config) return [];

  const type = Object.keys(config).find(key => label?.includes(key));
  if (!type) return [];

  return Array.from({length: 50}, (_, j) => {
    const path = config[type](j + 1);
    return {
      label: `${type} (${path})`,
      value: path,
    };
  });
};

export const CustomDerivation = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {bottom} = useSafeAreaInsets();
  const currentCoin = useSelector(selectCurrentCoin);
  const dispatch = useDispatch();
  const customDerivationSheetRef = useRef();
  const confirmActionRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAddresses, setSelectedAddresses] = useState([]);

  const derivationData = useMemo(() => {
    const chainName = currentCoin?.chain_name;
    if (!validateSupportedChain(chainName)) {
      return [customObj];
    }
    const convertedChainName = isEVMChain(chainName) ? 'ethereum' : chainName;

    const availableDerivePath = allDerivePath[convertedChainName] || [];

    const make50DerivePath = availableDerivePath.flatMap(item =>
      generatePaths(convertedChainName, item?.label),
    );

    return [customObj, ...make50DerivePath];
  }, [currentCoin?.chain_name]);

  const sortedAddresses = useMemo(() => {
    const addresses = Array.isArray(currentCoin?.deriveAddresses)
      ? currentCoin?.deriveAddresses
      : [];

    return [...addresses].sort((a, b) => {
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
  }, [currentCoin?.deriveAddresses, currentCoin?.address]);

  const allDeriveAddress = useMemo(
    () => [
      {
        title: 'All accounts',
        data: sortedAddresses,
      },
    ],
    [sortedAddresses],
  );

  // Every address except the currently-active one can be deleted.
  const deletableAddresses = useMemo(
    () =>
      sortedAddresses
        .filter(item => item?.address !== currentCoin?.address)
        .map(item => item?.address),
    [sortedAddresses, currentCoin?.address],
  );

  const hasDeletableAddresses = deletableAddresses.length > 0;

  const isAllSelected =
    deletableAddresses.length > 0 &&
    selectedAddresses.length === deletableAddresses.length;

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
    initialValues: {selectedDerivationOptions: '', customDerivePath: ''},
    validationSchema: Yup.object().shape({
      selectedDerivationOptions: Yup.string().required(
        'Derivation Options is required',
      ),
    }),
    onSubmit: async submittedValue => {
      try {
        if (!validateSupportedChain(currentCoin?.chain_name)) {
          return;
        }
        setIsSubmitting(true);
        const {selectedDerivationOptions, customDerivePath} = submittedValue;
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

  const isAtLimit =
    isBitcoinChain(currentCoin?.chain_name) &&
    (currentCoin?.deriveAddresses?.length ?? 0) >= 100;
  const isDisabled = !values?.selectedDerivationOptions || isAtLimit;

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedAddresses([]);
  }, []);

  const enterSelectionMode = useCallback(() => {
    customDerivationSheetRef.current &&
      customDerivationSheetRef.current.close();
    setSelectedAddresses([]);
    setIsSelectionMode(true);
  }, []);

  const toggleSelect = useCallback(
    address => {
      // The active address can never be selected for deletion.
      if (!address || address === currentCoin?.address) {
        return;
      }
      setSelectedAddresses(prev =>
        prev.includes(address)
          ? prev.filter(item => item !== address)
          : [...prev, address],
      );
    },
    [currentCoin?.address],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedAddresses(prev =>
      prev.length === deletableAddresses.length ? [] : [...deletableAddresses],
    );
  }, [deletableAddresses]);

  useLayoutEffect(() => {
    navigation?.setOptions({
      headerRight: () => {
        if (isSelectionMode) {
          return (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={exitSelectionMode}>
              <Text style={styles.headerButtonText}>{'Cancel'}</Text>
            </TouchableOpacity>
          );
        }
        if (!hasDeletableAddresses) {
          return null;
        }
        return (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={enterSelectionMode}>
            <Text style={styles.headerButtonText}>{'Select'}</Text>
          </TouchableOpacity>
        );
      },
    });
  }, [
    navigation,
    isSelectionMode,
    hasDeletableAddresses,
    enterSelectionMode,
    exitSelectionMode,
    styles.headerButton,
    styles.headerButtonText,
  ]);

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
              titleStyle={{color: theme.primary}}
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
            {isAtLimit && (
              <Text style={styles.textConfirm}>
                {'Maximum limit of 100 accounts reached'}
              </Text>
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
    isAtLimit,
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

  const renderHeader = useCallback(
    ({section: {title, data}}) => {
      if (!data?.length) {
        return null;
      }
      if (isSelectionMode && hasDeletableAddresses) {
        return (
          <View style={styles.listHeaderView}>
            <TouchableOpacity
              style={styles.selectAllRow}
              onPress={toggleSelectAll}>
              <Checkbox
                checked={isAllSelected}
                onChange={toggleSelectAll}
                customStyle={styles.selectAllCheckbox}
              />
              <Text style={styles.listHeaderTitle}>{'Select All'}</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={styles.listHeaderView}>
          <Text style={styles.listHeaderTitle}>{title}</Text>
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSelectionMode, hasDeletableAddresses, isAllSelected, toggleSelectAll],
  );

  const onPressDotIcon = useCallback(item => {
    customDerivationSheetRef.current &&
      customDerivationSheetRef.current.close();
    customDerivationSheetRef.current &&
      customDerivationSheetRef.current?.present();
    setSelectedItem(item);
  }, []);

  const renderItem = useCallback(
    ({item}) => {
      const isActive = currentCoin?.address === item?.address;
      const isSelected = selectedAddresses.includes(item?.address);
      const content = (
        <>
          <FastImage
            source={{uri: currentCoin?.icon}}
            style={styles.iconStyle}
            resizeMode={'contain'}
          />
          <View style={styles.textContainer}>
            <Text style={styles.derivePathStyle} numberOfLines={1}>
              {item?.derivePath || 'Default'}
              {isActive && (
                <Text style={styles.activeDerivePathStyle}>{' (ACTIVE)'}</Text>
              )}
            </Text>
            <Text style={styles.addressStyle} numberOfLines={1}>
              {getCustomizePublicAddress(item?.address)}
            </Text>
          </View>
          {isSelectionMode ? (
            isActive ? (
              <Text style={styles.activeBadge}>{'Active'}</Text>
            ) : (
              <Checkbox
                checked={isSelected}
                onChange={() => toggleSelect(item?.address)}
                customStyle={styles.itemCheckbox}
              />
            )
          ) : (
            <TouchableOpacity
              onPress={() => onPressDotIcon(item)}
              hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
              <EntypoIcon
                size={24}
                name={'dots-three-vertical'}
                color={theme.font}
              />
            </TouchableOpacity>
          )}
        </>
      );

      // In selection mode, the whole (non-active) row toggles selection.
      if (isSelectionMode && !isActive) {
        return (
          <TouchableOpacity
            style={styles.listItemView}
            activeOpacity={0.7}
            onPress={() => toggleSelect(item?.address)}>
            {content}
          </TouchableOpacity>
        );
      }
      return <View style={styles.listItemView}>{content}</View>;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentCoin?.address,
      currentCoin?.icon,
      isSelectionMode,
      selectedAddresses,
    ],
  );

  const onConfirmSuccess = useCallback(() => {
    setShowConfirmModal(false);
    const action = confirmActionRef.current;
    if (action === 'deleteBulk') {
      // Guard: never delete the active address, dedupe just in case.
      const addresses = selectedAddresses.filter(
        address => address && address !== currentCoin?.address,
      );
      if (!addresses.length) {
        return;
      }
      dispatch(deleteMultipleDeriveAddressesInCurrentCoin({addresses}));
      Toast.show({
        type: 'successToast',
        text1: addresses.length > 1 ? 'Addresses deleted' : 'Address deleted',
      });
      exitSelectionMode();
    } else if (action === 'deleteSingle') {
      if (currentCoin?.address === selectedItem?.address) {
        Toast.show({
          type: 'errorToast',
          text1: "Can't delete derive address",
          text2: "You can't delete the selected derive address",
        });
        return;
      }
      dispatch(
        deleteDeriveAddressInCurrentCoin({address: selectedItem?.address}),
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
    exitSelectionMode,
    selectedAddresses,
    selectedItem?.address,
    selectedItem?.privateKey,
  ]);

  const onPressDeleteSelected = useCallback(() => {
    confirmActionRef.current = 'deleteBulk';
    setShowConfirmModal(true);
  }, []);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <SectionList
          keyExtractor={(item, index) => item + index}
          sections={allDeriveAddress}
          renderItem={renderItem}
          keyboardShouldPersistTaps={'always'}
          renderSectionHeader={renderHeader}
          ListHeaderComponent={isSelectionMode ? null : HeaderComponent()}
          contentContainerStyle={
            isSelectionMode && selectedAddresses.length > 0
              ? {paddingBottom: 80 + bottom}
              : undefined
          }
          stickySectionHeadersEnabled={true}
        />
        {isSelectionMode && selectedAddresses.length > 0 && (
          <View style={[styles.deleteBar, {paddingBottom: 12}]}>
            <TouchableOpacity
              style={styles.deleteBarButton}
              onPress={onPressDeleteSelected}>
              <Text style={styles.deleteBarText}>
                {`Delete (${selectedAddresses.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <DeriveAddressSheet
          bottomSheetRef={ref => (customDerivationSheetRef.current = ref)}
          onDismiss={() => {
            customDerivationSheetRef.current.close();
          }}
          selectedItem={selectedItem}
          onItemPress={key => {
            if (key === 'copy_private_key') {
              confirmActionRef.current = 'copyPrivateKey';
              setShowConfirmModal(true);
            } else if (key === 'delete_derive_address') {
              confirmActionRef.current = 'deleteSingle';
              setShowConfirmModal(true);
            }
          }}
        />
        <ModalConfirmTransaction
          hideModal={() => {
            setShowConfirmModal(false);
          }}
          visible={showConfirmModal}
          onSuccess={onConfirmSuccess}
        />
      </View>
    </DokSafeAreaView>
  );
};
