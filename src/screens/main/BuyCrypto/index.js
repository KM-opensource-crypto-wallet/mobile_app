import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import myStyles from './BuyCryptoStyles';
import { useContext } from 'react';
import { ThemeContext } from '../../../theme/ThemeContext';
import { useSelector } from 'react-redux';
import {
  getCryptoProviders,
  getCryptoProvidersOTC,
  getSelectedCountry,
} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import { getName } from 'country-list';
import CryptoProviders from '../../../components/CryptoProviders';

const BuyCrypto = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const providers = useSelector(getCryptoProviders);
  const shownOTC = useSelector(getCryptoProvidersOTC);
  const country = useSelector(getSelectedCountry);
  if (providers.length === 0 && !shownOTC) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerView}>
            <Text
              style={
                styles.title
              }>{`No providers are available for selected country '${getName(
                country,
              )}'.`}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
  return <CryptoProviders />;
};

export default BuyCrypto;
