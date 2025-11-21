import React, {useContext, useState, useCallback} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';

import myStyles from './OTC2ScreenStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {shallowEqual, useSelector} from 'react-redux';
import {other, otherDark} from 'data/currency';
import DokDropdown from 'components/DokDropdown';
import CryptoCurrencyOptionItem from 'components/CryptoCurrencyOptionItem';
import CurrencyOptionItem from 'components/CurrencyOptionItem';
import CryptoRadioButton from 'components/CryptoRadioButton';
import CryptoCheckbox from 'components/CryptoCheckbox';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {addOTC} from 'dok-wallet-blockchain-networks/service/dokApi';
import {getUserCoinsOptions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';

const amountOptions = [
  {
    label: '5,000 to 10,000',
    value: '5,000 to 10,000',
  },
  {
    label: '10,000 to 20,000',
    value: '10,000 to 20,000',
  },
  {
    label: '20,000 to 50,000',
    value: '20,000 to 50,000',
  },
  {
    label: '50,000 to 100,000',
    value: '50,000 to 100,000',
  },
  {
    label: 'More than 100,000',
    value: 'More than 100,000',
  },
];

export const OTC2Screen = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const coinOptions = useSelector(getUserCoinsOptions, shallowEqual);
  const otherOptions = {
    label: 'Other',
    value: 'Other',
    options: {
      icon: theme?.backgroundColor === '#121212' ? other : otherDark,
      title: 'Other',
    },
  };
  const localCurrency = useSelector(getLocalCurrency);

  const [dropDownList, setDropDownList] = useState(
    Array.isArray(coinOptions)
      ? [...coinOptions, otherOptions]
      : [otherOptions],
  );
  const [state, setState] = useState({
    isBuy: true,
    selectedCryptoCoin: {},
    selectedAmount: '',
    sourceOfFund: '',
    terms: false,
    risk: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChangeCryptoCoin = useCallback(item => {
    setState(prevState => ({...prevState, selectedCryptoCoin: item}));
  }, []);

  const onSubmit = useCallback(async () => {
    try {
      const previousOTCData = route?.params?.data;
      if (previousOTCData) {
        setIsSubmitting(true);
        const postCode = previousOTCData?.zipcode;
        const payload = {
          fullName: previousOTCData?.fullname,
          email: previousOTCData?.email,
          address1: previousOTCData?.address1,
          city: previousOTCData?.city,
          postCode: postCode,
          country: previousOTCData?.country,
          fundSource: state?.sourceOfFund?.toLowerCase(),
          chain: state?.selectedCryptoCoin?.options?.chain_name,
          asset: state?.selectedCryptoCoin?.options?.symbol,
          type: state.isBuy ? 'buy' : 'sell',
          amount: `${state?.selectedAmount?.value} ${localCurrency}`,
          walletAddress: state?.selectedCryptoCoin?.options?.walletAddress,
        };
        if (previousOTCData?.address2) {
          payload.address2 = previousOTCData?.address2;
        }
        const resp = await addOTC(payload);
        setIsSubmitting(false);
        if (resp?.status === 200) {
          Alert.alert('Your OTC request was submitted.');
          navigation.navigate('Sidebar', {
            screen: 'Home',
          });
        }
      }
    } catch (e) {
      console.error(' Error in add OTC', e);
      setIsSubmitting(false);
    }
  }, [
    route?.params?.data,
    state?.sourceOfFund,
    state?.selectedCryptoCoin?.options?.chain_name,
    state?.selectedCryptoCoin?.options?.walletAddress,
    state?.selectedCryptoCoin?.options?.symbol,
    state.isBuy,
    state?.selectedAmount?.value,
    localCurrency,
    navigation,
  ]);

  const {isBuy, risk, selectedAmount, selectedCryptoCoin, sourceOfFund, terms} =
    state;
  const isDisabled =
    !risk ||
    !selectedAmount ||
    !selectedCryptoCoin?.label ||
    !sourceOfFund ||
    !terms;
  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      enableResetScrollToCoords={false}
      keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
      style={styles.container}
      contentContainerStyle={styles.contentContainerStyle}>
      <View style={{flex: 1}}>
        <View style={styles.formInput}>
          <Text
            style={{
              ...styles.title,
            }}>
            {'Choose your options'}
          </Text>
          <View style={styles.mainOptionsView}>
            <TouchableOpacity
              onPress={() => {
                setState(prevState => ({
                  ...prevState,
                  isBuy: true,
                }));
              }}
              style={[
                isBuy ? styles.selectedMainOptions : styles.mainSubViewOptions,
              ]}>
              <Text
                style={[
                  isBuy ? styles.selectedMainOptionText : styles.mainOptionText,
                ]}>
                {'Buy Crypto'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setState(prevState => ({
                  ...prevState,
                  isBuy: false,
                }));
              }}
              style={[
                !isBuy ? styles.selectedMainOptions : styles.mainSubViewOptions,
              ]}>
              <Text
                style={[
                  !isBuy
                    ? styles.selectedMainOptionText
                    : styles.mainOptionText,
                ]}>
                {'Sell Crypto'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dropdownContainer}>
            <DokDropdown
              titleStyle={{color: theme.primary}}
              placeholder={'Select Crypto'}
              title={'Select Crypto'}
              data={dropDownList}
              onChangeValue={onChangeCryptoCoin}
              value={selectedCryptoCoin?.value}
              renderItem={item => {
                return <CryptoCurrencyOptionItem item={item} />;
              }}
            />
          </View>
          <DokDropdown
            titleStyle={{color: theme.primary}}
            placeholder={'Select amount'}
            title={'Select amount'}
            data={amountOptions}
            onChangeValue={item => {
              setState(prevState => ({
                ...prevState,
                selectedAmount: item,
              }));
            }}
            value={selectedAmount}
            renderItem={item => {
              return <CurrencyOptionItem item={item} />;
            }}
          />
          <CryptoRadioButton
            setValueRadioBtn={item => {
              setState(prevState => ({
                ...prevState,
                sourceOfFund: item,
              }));
            }}
          />
        </View>
        <Text style={styles.textStyle}>
          {'This service is provided by ozaraglobal.com.'}
        </Text>
        <CryptoCheckbox
          setTermsCheck={isChecked => {
            setState(prevState => ({
              ...prevState,
              terms: isChecked,
            }));
          }}
          number={'1'}
          title={'terms and conditions'}
          onPress={() => {
            InAppBrowser.open(
              'https://ozaraglobal.com/terms.php',
              inAppBrowserOptions,
            ).then();
          }}
        />
        <CryptoCheckbox
          setRiskCheck={isChecked => {
            setState(prevState => ({
              ...prevState,
              risk: isChecked,
            }));
          }}
          number={'2'}
          title={'Risk disclaimer'}
          onPress={() => {
            InAppBrowser.open(
              'https://ozaraglobal.com/policy.php',
              inAppBrowserOptions,
            ).then();
          }}
        />
        <TouchableOpacity
          disabled={isDisabled}
          style={[
            styles.button,
            {backgroundColor: isDisabled ? theme.gray : theme.background},
          ]}
          onPress={onSubmit}>
          {isSubmitting ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <Text style={styles.buttonTitle}>{'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};
