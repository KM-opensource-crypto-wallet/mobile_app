import React, {
  useState,
  useEffect,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Switch, TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {wallet} from 'data/data';
import myStyles from './CreateWalletStyles';
import {useSelector, shallowEqual, useDispatch} from 'react-redux';
import Exclamationcircleo from 'assets/images/icons/exclamationcircle.svg';
import {isIpad, useFloatingHeight} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';
import ThemedIcon from 'components/ThemedIcon';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ModalDelete from 'components/ModalDelete';
import ModalHideWalletConfirm from 'components/ModalHideWalletConfirm';
import DokRadioButton from 'components/DokRadioButton';
import {
  _currentWalletIndexSelector,
  isWalletHiddenAndLocked,
  selectAllWalletName,
  selectAllWallets,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  clearWalletHideSettings,
  createWallet,
  deleteWallet,
  isSecretCodeInUseByOtherWallet,
  RELOCK_OPTIONS,
  setWalletHideSettings,
  updateWalletName,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {deleteAlertThunk} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import {getNotificationAlerts} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSelector';
import {debounce} from 'dok-wallet-blockchain-networks/helper';
import Spinner from 'components/Spinner';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {store} from 'redux/store';
import {
  generateSecretCodeSalt,
  hashSecretCode,
  isSecretCodeFormatValid,
  secretCodeIncludesWalletName,
  SECRET_CODE_ITERATIONS,
  SECRET_CODE_MAX_LENGTH,
  SECRET_CODE_MIN_LENGTH,
} from 'utils/hideWallet';

const RELOCK_OPTIONS_UI = [
  {label: 'On app relaunch (default)', value: RELOCK_OPTIONS.RELAUNCH},
  {label: 'On app background', value: RELOCK_OPTIONS.BACKGROUND},
  {label: 'Manual only', value: RELOCK_OPTIONS.MANUAL},
];

// import { useNavigationState, CommonActions, StackActions } from "@react-navigation/native";

const CreateWallet = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const formikRef = useRef(null);
  const dispatch = useDispatch();
  const walletName = route?.params?.walletName;
  const phrase = route?.params?.phrase;
  const privateKey = route?.params?.privateKey;
  const chain_name = route?.params?.chain_name;
  const wallItem = route?.params?.item;
  const walletIndex = route?.params?.walletIndex?.toString();
  const currentWallet = useSelector(selectCurrentWallet);
  const currentWalletIndex = useSelector(_currentWalletIndexSelector);
  const allWalletName = useSelector(selectAllWalletName, shallowEqual);
  // const currentWalletIndex = useSelector(currentWalletIndexSelector);
  const allWallets = useSelector(selectAllWallets);
  const finalAllWallets = useRef(
    allWalletName.filter(subItem => subItem !== walletName),
  );
  const notificationAlerts = useSelector(getNotificationAlerts);
  // const [currentWalletName, setCurrentWalletName] = useState(walletName);
  // const currentWalletName = currentWallet.name;
  // const allCoins = useSelector(getAllCoins);
  // const allWallets = useSelector(getWallets);
  const defaultNewWalletName = currentWallet?.walletName; //`Wallet ${allWallets.length}`;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const floatingHeight = useFloatingHeight();
  // const key = useSelector(getNewKey);

  // The wallet being edited (only reachable while it's visible, i.e. never
  // hidden+locked - see selectVisibleWallets), as opposed to `currentWallet`
  // which is the globally active wallet.
  const editingWallet =
    walletIndex !== undefined ? allWallets[walletIndex] : null;
  const initialHideSettings = editingWallet?.hideSettings || null;
  const [isHideEnabled, setIsHideEnabled] = useState(
    !!initialHideSettings?.isHidden,
  );
  const [secretCode, setSecretCode] = useState('');
  const [secretCodeError, setSecretCodeError] = useState(null);
  const [hideToggleError, setHideToggleError] = useState(null);
  const [relockOption, setRelockOption] = useState(
    initialHideSettings?.relockOption || RELOCK_OPTIONS.RELAUNCH,
  );
  // null | 'info' | 'confirm' - a single source of truth so the info and
  // confirm modals can never both be considered visible at once.
  const [hideModal, setHideModal] = useState(null);
  const pendingSubmitValuesRef = useRef(null);
  // AC6: at least one wallet must stay visible. If no OTHER wallet is
  // currently visible, hiding this one would leave none - disable the
  // toggle outright instead of letting the user tap it and then blocking.
  const hasOtherVisibleWallet = allWallets.some(
    (item, index) =>
      index !== Number(walletIndex) && !isWalletHiddenAndLocked(item),
  );
  const isHideToggleDisabled = !isHideEnabled && !hasOtherVisibleWallet;
  const isSecretCodeRequired = isHideEnabled && !initialHideSettings?.isHidden;
  const isHideSectionInvalid =
    isHideEnabled &&
    ((!secretCode && isSecretCodeRequired) ||
      (!!secretCode && !isSecretCodeFormatValid(secretCode)) ||
      !!secretCodeError);
  const selectedRelockLabel = RELOCK_OPTIONS_UI.find(
    option => option.value === relockOption,
  )?.label;

  const [wrong, setWrong] = useState(false);
  const isCurrentWallet = walletName === defaultNewWalletName;
  //------------------ for goBack -------------------//
  // const currentRoutes = useNavigationState((state) => state.routes);

  // useEffect(() => {
  //   navigation.dispatch((state) => {
  //     const routes = state.routes.filter((r) => {
  //       return r.name !== "Verify" && r.name !== "VerifyCreate";
  //     });

  //     const isHome = currentRoutes.find(({ name }) => name === "Sidebar");
  //     isHome ? null : routes.unshift({ name: "Sidebar" });

  //     return CommonActions.reset({
  //       ...state,
  //       routes,
  //       wallet.service.js: routes.length - 1,
  //     });
  //   });
  // }, [route]);

  useEffect(() => {
    if (!walletName) {
      let newWalletName = null;
      if (allWallets.length) {
        let newWalletIndex = allWallets.length + 1;
        do {
          newWalletName = `Wallet ${newWalletIndex}`;
          newWalletIndex += 1;
        } while (allWalletName.includes(newWalletName) === true);
      }
      setTimeout(() => {
        formikRef.current?.setFieldValue(
          'name',
          newWalletName || 'Main Wallet',
        );
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!isCurrentWallet && walletName) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
            onPress={() => {
              setShowDeleteModal(true);
            }}>
            <MaterialCommunityIcons
              name="delete"
              color={theme.font}
              size={22}
              style={{marginRight: isIpad ? 50 : 10, marginBottom: 3}}
            />
          </TouchableOpacity>
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateNewWalletName = value => {
    if (editingWallet?.walletName !== value) {
      const wrong = allWallets.some(({walletName}, index) => {
        if (walletName === value && index !== Number(walletIndex)) {
          return true;
        }
        return false;
      });
      setWrong(wrong);
    }
  };

  const onPressYes = useCallback(async () => {
    setShowDeleteModal(false);

    // Find the wallet being deleted
    const walletToDelete = allWallets.find(
      (_, index) => index.toString() === walletIndex,
    );
    if (walletToDelete) {
      // Get notification alerts for this wallet
      const walletAlerts = notificationAlerts.filter(
        alert =>
          alert.walletClientId === walletToDelete.clientId ||
          alert.walletId === walletToDelete.clientId,
      );

      // Delete all notification subscriptions for this wallet
      if (walletAlerts.length > 0) {
        const deletePromises = walletAlerts.map(alert =>
          dispatch(deleteAlertThunk({item: alert})),
        );
        await Promise.all(deletePromises);
      }
    }

    navigation.reset({
      index: 0,
      routes: [{name: 'Sidebar'}],
    });

    setTimeout(() => {
      if (walletIndex !== null && walletIndex !== undefined) {
        dispatch(deleteWallet(walletIndex));
      }
    }, 1000);
  }, [dispatch, navigation, walletIndex, allWallets, notificationAlerts]);

  const onPressNo = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Debounced since PBKDF2 is deliberately slow - runs against every other
  // hidden wallet's stored salt/hash (AC2's "code already in use" rule).
  const checkDuplicateSecretCode = useMemo(
    () =>
      debounce(code => {
        const inUse = isSecretCodeInUseByOtherWallet(
          store.getState(),
          code,
          walletIndex,
        );
        setSecretCodeError(
          inUse ? 'This code is already used by another hidden wallet' : null,
        );
      }, 300),
    [walletIndex],
  );

  const handleSecretCodeChange = text => {
    setSecretCode(text);
    if (!text) {
      setSecretCodeError(null);
      return;
    }
    if (!isSecretCodeFormatValid(text)) {
      setSecretCodeError(
        `Must be ${SECRET_CODE_MIN_LENGTH}-${SECRET_CODE_MAX_LENGTH} characters: letters, numbers, @, _ or - only`,
      );
      return;
    }
    if (secretCodeIncludesWalletName(text, finalAllWallets.current)) {
      setSecretCodeError('Secret code must not include another wallet name');
      return;
    }
    setSecretCodeError(null);
    checkDuplicateSecretCode(text);
  };

  const handleToggleHide = value => {
    // The switch is already `disabled` in this case (see isHideToggleDisabled)
    // - this is just a defensive fallback against it firing anyway.
    if (value && !hasOtherVisibleWallet) {
      setHideToggleError(
        'At least one wallet must stay visible. Unhide or add another wallet before hiding this one.',
      );
      return;
    }
    setHideToggleError(null);
    setIsHideEnabled(value);
    if (!value) {
      setSecretCode('');
      setSecretCodeError(null);
    }
  };

  const handleRelockChange = label => {
    const found = RELOCK_OPTIONS_UI.find(option => option.label === label);
    if (found) {
      setRelockOption(found.value);
    }
  };

  const performWalletSave = useCallback(
    async values => {
      if (walletName) {
        const targetIndex = walletIndex ?? currentWalletIndex;
        dispatch(
          updateWalletName({
            index: targetIndex,
            walletName: values.name,
          }),
        );

        if (isHideEnabled) {
          if (secretCode) {
            // Code was already validated (name-inclusion + not-in-use-by-
            // another-wallet) in handleSubmit, before the confirm modal
            // ever opened - nothing async happens between then and here.
            const salt = generateSecretCodeSalt();
            const hash = hashSecretCode(secretCode, salt);
            dispatch(
              setWalletHideSettings({
                walletIndex: targetIndex,
                secretCodeSalt: salt,
                secretCodeHash: hash,
                secretCodeIterations: SECRET_CODE_ITERATIONS,
                relockOption,
              }),
            );
          } else if (initialHideSettings?.isHidden) {
            // Blank code while already hidden = keep the existing code,
            // only the re-lock option may have changed.
            dispatch(
              setWalletHideSettings({
                walletIndex: targetIndex,
                secretCodeSalt: initialHideSettings.secretCodeSalt,
                secretCodeHash: initialHideSettings.secretCodeHash,
                secretCodeIterations: initialHideSettings.secretCodeIterations,
                relockOption,
              }),
            );
          }
        } else if (initialHideSettings?.isHidden) {
          dispatch(clearWalletHideSettings({walletIndex: targetIndex}));
        }

        navigation.navigate('Sidebar', {
          screen: 'Home',
        });
      } else {
        // Check if importing by private key - skip SelectCoins screen
        if (privateKey && chain_name) {
          try {
            setIsLoading(true);
            await dispatch(
              createWallet({
                walletName: values.name || 'Main Wallet',
                phrase,
                privateKey,
                chain_name,
              }),
            ).unwrap();
            setIsLoading(false);
            navigation.reset({
              index: 0,
              routes: [{name: 'Sidebar'}],
            });
          } catch (e) {
            setIsLoading(false);
            console.error('error in create wallet', e.stack);
          }
        } else {
          // Navigate to SelectCoins screen for new wallet or mnemonic import
          navigation.navigate('SelectCoins', {
            walletName: values.name || 'Main Wallet',
            phrase,
          });
        }
      }
    },
    [
      walletName,
      walletIndex,
      currentWalletIndex,
      dispatch,
      isHideEnabled,
      secretCode,
      relockOption,
      initialHideSettings,
      navigation,
      privateKey,
      chain_name,
      phrase,
    ],
  );

  const handleSubmit = useCallback(
    async values => {
      if (isHideEnabled) {
        if (secretCode) {
          if (
            secretCodeIncludesWalletName(secretCode, finalAllWallets.current)
          ) {
            setSecretCodeError(
              'Secret code must not include another wallet name',
            );
            return;
          }
          if (
            isSecretCodeInUseByOtherWallet(
              store.getState(),
              secretCode,
              walletIndex,
            )
          ) {
            setSecretCodeError(
              'This code is already used by another hidden wallet',
            );
            return;
          }
        }
        Keyboard.dismiss();
        pendingSubmitValuesRef.current = values;
        setHideModal('confirm');
        return;
      }
      await performWalletSave(values);
    },
    [isHideEnabled, performWalletSave, secretCode, walletIndex],
  );

  const onConfirmHideAndSave = useCallback(async () => {
    setHideModal(null);
    const values = pendingSubmitValuesRef.current;
    pendingSubmitValuesRef.current = null;
    if (values) {
      await performWalletSave(values);
    }
  }, [performWalletSave]);

  const onCancelHideModal = useCallback(() => {
    setHideModal(null);
    pendingSubmitValuesRef.current = null;
  }, []);

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('* Name cannot be empty')
      .notOneOf(finalAllWallets.current, 'The name of wallet already existed'),
  });

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={80}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <View style={styles.formInput}>
            <Text style={styles.brand}>{walletName || ''}</Text>
            <Formik
              enableReinitialize={true}
              initialValues={{
                name: walletName || '',
              }}
              innerRef={formikRef}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}>
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View
                  style={{
                    flex: 1,
                  }}>
                  <ScrollView
                    style={{flex: 1}}
                    contentContainerStyle={{flexGrow: 1}}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <TextInput
                      style={styles.input}
                      label="Name"
                      textColor={theme.font}
                      theme={{
                        colors: {
                          onSurfaceVariant: errors ? theme.gray : 'red',
                        },
                      }}
                      outlineColor={errors.name ? 'red' : theme.gray}
                      activeOutlineColor={
                        errors.name ? 'red' : theme.borderActiveColor
                      }
                      autoCapitalize="none"
                      returnKeyType="next"
                      mode="outlined"
                      blurOnSubmit={false}
                      name="name"
                      autoFocus={true}
                      onChangeText={handleChange('name')}
                      // onBlur={handleBlur('name')}
                      onBlur={() => {
                        validateNewWalletName(values.name);
                        handleBlur('currentPassword');
                      }}
                      value={values.name}
                      // onSubmitEditing={handleSubmit}
                    />
                    {errors.name && (
                      <Text style={styles.textConfirm}>{errors.name}</Text>
                    )}

                    {wrong === true && (
                      <Text style={styles.textWarning}>
                        * Choose a different wallet name
                      </Text>
                    )}
                    {walletName ? (
                      <View>
                        <Text style={styles.listTitle}>
                          Secret phrase backups
                        </Text>
                        {wallet.map((item, index) => (
                          <TouchableOpacity
                            style={styles.item}
                            key={index}
                            onPress={() => {
                              if (item.title === 'Manual Backup') {
                                navigation.push('VerifyLogin');
                              }
                            }}>
                            <View style={styles.itemIcon}>
                              <ThemedIcon
                                icon={item.icon}
                                theme={theme}
                                font={2}
                              />
                            </View>

                            <View style={styles.itemSection}>
                              <Text style={styles.itemName}>{item.title}</Text>
                              <Text
                                style={{
                                  ...styles.itemText,
                                  color:
                                    item.body === 'Active' ? 'green' : 'red',
                                }}>
                                {item.body}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                        <View style={styles.infoSection}>
                          <Exclamationcircleo
                            height="20"
                            width="20"
                            fill={theme.font}
                          />
                          <Text style={styles.info}>
                            We highly recommend completing both backup options
                            to help prevent the loss your crypto.
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {walletName ? (
                      <View style={styles.hideWalletSection}>
                        <View style={styles.hideWalletHeaderRow}>
                          <Text style={styles.hideWalletLabel}>
                            Hide wallet
                          </Text>
                          <TouchableOpacity
                            style={styles.infoButton}
                            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
                            onPress={() => setHideModal('info')}>
                            <MaterialCommunityIcons
                              name="help-circle-outline"
                              size={20}
                              color={theme.font}
                            />
                          </TouchableOpacity>
                          <View style={{flex: 1}} />
                          <Switch
                            trackColor={{false: 'gray', true: '#0ecd1764'}}
                            onValueChange={handleToggleHide}
                            value={isHideEnabled}
                            disabled={isHideToggleDisabled}
                          />
                        </View>

                        {(hideToggleError || isHideToggleDisabled) && (
                          <Text style={styles.hideToggleError}>
                            {hideToggleError ||
                              'At least one wallet must stay visible. Unhide or add another wallet before hiding this one.'}
                          </Text>
                        )}

                        {isHideEnabled && (
                          <>
                            <TextInput
                              style={styles.input}
                              label="Secret code"
                              textColor={theme.font}
                              outlineColor={
                                secretCodeError ? 'red' : theme.gray
                              }
                              activeOutlineColor={
                                secretCodeError
                                  ? 'red'
                                  : theme.borderActiveColor
                              }
                              autoCapitalize="none"
                              mode="outlined"
                              value={secretCode}
                              onChangeText={handleSecretCodeChange}
                              placeholder={
                                initialHideSettings?.isHidden
                                  ? 'Leave blank to keep current code'
                                  : ''
                              }
                            />
                            {secretCodeError && (
                              <Text style={styles.textConfirm}>
                                {secretCodeError}
                              </Text>
                            )}

                            <DokRadioButton
                              title="Re-hide this wallet:"
                              options={RELOCK_OPTIONS_UI}
                              checked={selectedRelockLabel}
                              setChecked={handleRelockChange}
                            />
                          </>
                        )}
                      </View>
                    ) : null}
                  </ScrollView>
                  <TouchableOpacity
                    disabled={(wrong && true) || isHideSectionInvalid}
                    style={{
                      ...styles.button,
                      opacity: wrong || isHideSectionInvalid ? 0.5 : 1,
                    }}
                    onPress={handleSubmit}>
                    <Text style={styles.buttonTitle}>
                      {walletName
                        ? 'Update Wallet'
                        : privateKey
                        ? 'Create Wallet'
                        : 'Next'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
          <ModalDelete
            walletName={walletName}
            onPressYes={onPressYes}
            onPressNo={onPressNo}
            visible={showDeleteModal}
          />
          <ModalHideWalletConfirm
            visible={!!hideModal}
            mode={hideModal || 'confirm'}
            relockOption={relockOption}
            onCancel={onCancelHideModal}
            onConfirm={onConfirmHideAndSave}
          />
          {isLoading && <Spinner />}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </DokSafeAreaView>
  );
};

export default CreateWallet;
