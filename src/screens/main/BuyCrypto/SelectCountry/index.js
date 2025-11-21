import React, {useCallback, useEffect, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import myStyles from './SelectCountryStyles';
import {useContext} from 'react';
import {ThemeContext} from 'theme/ThemeContext';
import {useDispatch, useSelector} from 'react-redux';
import {
  getFetchProvider,
  getSelectedCountry,
} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import DokCountryPicker from 'components/DokCountryPicker';
import {
  fetchSupportedBuyCryptoCurrency,
  setCountry,
} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProviderSlice';

const SelectCountry = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const selectedCountry = useSelector(getSelectedCountry);
  const fetchProvider = useSelector(getFetchProvider);
  const dispatch = useDispatch();
  const isButtonClick = useRef(false);

  const {isSellCrypto} = route.params || {};

  useEffect(() => {
    if (!fetchProvider && isButtonClick.current) {
      isButtonClick.current = false;
      navigation.navigate(isSellCrypto ? 'SellCrypto' : 'iOSBuyCrypto');
    }
  }, [fetchProvider, navigation, isSellCrypto]);

  const onPressNext = useCallback(() => {
    isButtonClick.current = true;
    const fromDevice = Platform.OS;
    dispatch(fetchSupportedBuyCryptoCurrency({fromDevice}));
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.countryContainer}>
          <Text
            style={{
              ...styles.title,
            }}>
            {'Select Country'}
          </Text>
          <DokCountryPicker
            isVisible={false}
            onSelect={countryDetails => {
              dispatch(setCountry(countryDetails?.cca2));
            }}
            countryCode={selectedCountry}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={onPressNext}
            disabled={fetchProvider || !selectedCountry}>
            {fetchProvider ? (
              <ActivityIndicator color={'white'} size={'large'} />
            ) : (
              <Text style={styles.buttonTitle}>{'Next'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SelectCountry;
