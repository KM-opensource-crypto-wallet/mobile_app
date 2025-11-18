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
  Platform,
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
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
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
  // const [currentWalletName, setCurrentWalletName] = useState(walletName);
  // const currentWalletName = currentWallet.name;
  // const allCoins = useSelector(getAllCoins);
  // const allWallets = useSelector(getWallets);
  const defaultNewWalletName = currentWallet?.walletName; //`Wallet ${allWallets.length}`;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const floatingHeight = useFloatingHeight();
  // const key = useSelector(getNewKey);

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
    if (currentWallet?.walletName !== value) {
      const wrong = allWallets.some(({walletName}, index) => {
        if (walletName === value && index !== currentWallet.id) {
          return true;
        }
        return false;
      });
      setWrong(wrong);
    }
  };

  const onPressYes = useCallback(() => {
    setShowDeleteModal(false);
    navigation.reset({
      index: 0,
      routes: [{name: 'Sidebar'}],
    });
    setTimeout(() => {
      if (walletIndex !== null && walletIndex !== undefined) {
        dispatch(deleteWallet(walletIndex));
      }
    }, 1000);
  }, [dispatch, navigation, walletIndex]);

  const onPressNo = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleSubmit = async values => {
    if (walletName) {
      dispatch(
        updateWalletName({
          index: walletIndex ?? currentWalletIndex,
          walletName: values.name,
        }),
      );
      navigation.navigate('Home');
    } else {
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
    }
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('* Name cannot be empty')
      .notOneOf(finalAllWallets.current, 'The name of wallet already existed'),
  });

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={'padding'}
          keyboardVerticalOffset={100}
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
                  <View style={{flex: 1}}>
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
                      returnKeyType="done"
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
                      onSubmitEditing={dismissKeyboard}
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
                  </View>
                  <TouchableOpacity
                    disabled={wrong && true}
                    style={{...styles.button, opacity: wrong && 0.5}}
                    onPress={handleSubmit}>
                    <Text style={styles.buttonTitle}>
                      {walletName ? 'Update Wallet' : 'Create Wallet'}
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
