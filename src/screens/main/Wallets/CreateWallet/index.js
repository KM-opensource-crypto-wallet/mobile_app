import React, {
  useState,
  useEffect,
  useContext,
  useLayoutEffect,
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
  ActivityIndicator,
} from 'react-native';
import {TextInput} from 'react-native-paper';
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
import {
  _currentWalletIndexSelector,
  selectAllWalletName,
  selectAllWallets,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  createWallet,
  deleteWallet,
  updateWalletName,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {deleteAlertsForWalletThunk} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import {
  selectIsSyncing,
  selectSyncingWalletIndex,
  selectSyncingWalletName,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSelectors';
import useCoinScanCooldown from 'hooks/useCoinScanCooldown';
import Spinner from 'components/Spinner';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

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
  const walletIndex = route?.params?.walletIndex?.toString();
  const currentWallet = useSelector(selectCurrentWallet);
  const currentWalletIndex = useSelector(_currentWalletIndexSelector);
  const allWalletName = useSelector(selectAllWalletName, shallowEqual);
  // const currentWalletIndex = useSelector(currentWalletIndexSelector);
  const allWallets = useSelector(selectAllWallets);
  const finalAllWallets = useRef(
    allWalletName.filter(subItem => subItem !== walletName),
  );
  // const [currentWalletName, setCurrentWalletName] = useState(walletName);
  // const currentWalletName = currentWallet.name;
  // const allCoins = useSelector(getAllCoins);
  // const allWallets = useSelector(getWallets);
  const defaultNewWalletName = currentWallet?.walletName; //`Wallet ${allWallets.length}`;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const key = useSelector(getNewKey);

  // The wallet being edited (only reachable while it's visible, i.e. never
  // hidden+locked - see selectVisibleWallets), as opposed to `currentWallet`
  // which is the globally active wallet.
  const editingWallet =
    walletIndex !== undefined ? allWallets[walletIndex] : null;

  // Coin scan (1 per 24h per wallet) targets the wallet being edited
  const scanTargetIndex = walletIndex ?? currentWalletIndex;
  const scanWallet = editingWallet ?? currentWallet;
  const {isAvailable: isScanAvailable, remainingLabel: scanRemainingLabel} =
    useCoinScanCooldown(scanWallet?.lastCoinsScanTimestamp);
  const isCoinSyncRunning = useSelector(selectIsSyncing);
  const syncingWalletIndex = useSelector(selectSyncingWalletIndex);
  const syncingWalletName = useSelector(selectSyncingWalletName);
  const isScanningThisWallet =
    isCoinSyncRunning &&
    syncingWalletIndex !== null &&
    Number(syncingWalletIndex) === Number(scanTargetIndex);
  // Only one scan can run at a time - lock the row while another wallet scans
  const isScanningOtherWallet = isCoinSyncRunning && !isScanningThisWallet;
  const isScanRowEnabled =
    isScanningThisWallet || (isScanAvailable && !isScanningOtherWallet);

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
    if (walletToDelete?.clientId) {
      // Delete every notification subscription for this wallet in a single
      // backend call. Wallet deletion proceeds even if this fails.
      await dispatch(
        deleteAlertsForWalletThunk({walletClientId: walletToDelete.clientId}),
      );
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
  }, [dispatch, navigation, walletIndex, allWallets]);

  const onPressNo = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

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
      navigation,
      privateKey,
      chain_name,
      phrase,
    ],
  );

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
              onSubmit={performWalletSave}>
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
                      autoCorrect={false}
                      autoComplete="off"
                      spellCheck={false}
                      returnKeyType="done"
                      mode="outlined"
                      blurOnSubmit={false}
                      name="name"
                      autoFocus={!walletName}
                      onChangeText={handleChange('name')}
                      // onBlur={handleBlur('name')}
                      onBlur={() => {
                        validateNewWalletName(values.name);
                        handleBlur('currentPassword');
                      }}
                      value={values.name}
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                      }}
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
                      <TouchableOpacity
                        style={{...styles.item, marginTop: 20}}
                        onPress={() =>
                          navigation.navigate('HideWallet', {walletIndex})
                        }>
                        <View style={styles.itemIcon}>
                          <MaterialCommunityIcons
                            name="eye-off-outline"
                            size={22}
                            color={theme.font}
                          />
                        </View>
                        <View style={styles.itemSection}>
                          <Text style={styles.itemName}>Hide Wallet</Text>
                          <Text style={{...styles.itemText, color: theme.gray}}>
                            {editingWallet?.hideSettings
                              ? 'Hidden'
                              : 'Not hidden'}
                          </Text>
                        </View>
                        <View style={{flex: 1}} />
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={theme.font}
                        />
                      </TouchableOpacity>
                    ) : null}

                    {walletName ? (
                      <TouchableOpacity
                        style={{
                          ...styles.item,
                          opacity: isScanRowEnabled ? 1 : 0.5,
                        }}
                        disabled={!isScanRowEnabled}
                        onPress={() =>
                          navigation.navigate('CoinSyncScreen', {
                            walletIndex: Number(scanTargetIndex),
                          })
                        }>
                        <View
                          style={{
                            ...styles.scanIconBubble,
                            ...(!isScanRowEnabled
                              ? styles.scanIconBubbleDisabled
                              : {}),
                          }}>
                          {isScanningThisWallet ? (
                            <ActivityIndicator
                              size="small"
                              color={theme.background}
                            />
                          ) : (
                            <MaterialCommunityIcons
                              name={
                                isScanningOtherWallet
                                  ? 'timer-sand'
                                  : isScanAvailable
                                  ? 'radar'
                                  : 'clock-outline'
                              }
                              size={22}
                              color={
                                isScanRowEnabled ? theme.background : theme.gray
                              }
                            />
                          )}
                        </View>
                        <View style={styles.itemSection}>
                          <Text style={styles.itemName}>Scan Coins</Text>
                          <Text style={{...styles.itemText, color: theme.gray}}>
                            {isScanningThisWallet
                              ? 'Scanning in progress — tap to view'
                              : isScanningOtherWallet
                              ? syncingWalletName
                                ? `Scanning "${syncingWalletName}"…`
                                : 'Another wallet is being scanned…'
                              : isScanAvailable
                              ? 'Discover assets across 200+ coins'
                              : `Available in ${scanRemainingLabel}`}
                          </Text>
                        </View>
                        <View style={{flex: 1}} />
                        {isScanRowEnabled && (
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={22}
                            color={theme.font}
                          />
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </ScrollView>
                  <TouchableOpacity
                    disabled={wrong && true}
                    style={{
                      ...styles.button,
                      opacity: wrong ? 0.5 : 1,
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
          {isLoading && <Spinner />}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </DokSafeAreaView>
  );
};

export default CreateWallet;
