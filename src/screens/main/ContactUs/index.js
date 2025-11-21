import React, {useContext, useCallback} from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Linking,
  ImageBackground,
} from 'react-native';
import myStyles from './ContactUsStyles';
import {ThemeContext} from 'theme/ThemeContext';
import WalletConnectItem from 'components/WalletConnectItem';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {CARD_2, CONTACT_DETAILS} from 'utils/wlData';
import {useSelector} from 'react-redux';
import {getCryptoProvidersOTC} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';

const ContactUs = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const shownOTC = useSelector(getCryptoProvidersOTC);
  const localCurrency = useSelector(getLocalCurrency);

  const onPressContactViaEmail = useCallback(async () => {
    try {
      await Linking.openURL(`mailto:${CONTACT_DETAILS.email}`);
    } catch (e) {
      console.error('error in open emails', e);
    }
  }, []);

  const onPressContactViaTelegram = useCallback(async () => {
    try {
      if (CONTACT_DETAILS.telegram) {
        await Linking.openURL(CONTACT_DETAILS.telegram);
      }
    } catch (e) {
      console.error('error in open Telegram', e);
    }
  }, []);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainerStyle}
          bounces={false}>
          <Text style={styles.title}>
            {
              "Have questions or feedback? Reach out to us! Our team is here to assist you with any inquiries. Contact us today, and we'll be in touch shortly."
            }
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onPressContactViaEmail}>
            <Text style={styles.buttonTitle}>{'Contact via Email'}</Text>
          </TouchableOpacity>
          {!!CONTACT_DETAILS.telegram && (
            <>
              <Text style={styles.descriptions}>{'OR'}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={onPressContactViaTelegram}>
                <Text style={styles.buttonTitle}>{'Contact via Telegram'}</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.borderView} />
          <WalletConnectItem />
          <>
            {shownOTC && (
              <View style={styles.cardWrapper}>
                <TouchableOpacity
                  style={styles.cardBox}
                  onPress={() => navigation.navigate('OTC')}>
                  <ImageBackground
                    source={CARD_2}
                    style={styles.cardItem}
                    resizeMode={'contain'}>
                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle} numberOfLines={3}>
                        {'OTC'}
                      </Text>
                      <Text style={styles.cardDescription} numberOfLines={1}>
                        {`(Must be over ${currencySymbol[localCurrency]}10000)`}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            )}
          </>
        </ScrollView>
      </View>
    </DokSafeAreaView>
  );
};

export default ContactUs;
