import React, {useContext, useCallback} from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import myStyles from './ContactUsStyles';
import {ThemeContext} from 'theme/ThemeContext';
import WalletConnectItem from 'components/WalletConnectItem';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {CARD_2, CONTACT_DETAILS} from 'utils/wlData';
import {useSelector} from 'react-redux';
import {getCryptoProvidersOTC} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';
import {openSupportEmail, openSupportTelegram} from 'utils/contactSupport';
import {getSupportId} from 'services/logger';

const ContactUs = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const shownOTC = useSelector(getCryptoProvidersOTC);
  const localCurrency = useSelector(getLocalCurrency);

  const supportId = getSupportId();

  const onPressSupportId = useCallback(() => {
    Clipboard.setString(supportId);
    Toast.show({
      type: 'successToast',
      text1: 'Support ID copied',
    });
  }, [supportId]);

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
          <TouchableOpacity style={styles.button} onPress={openSupportEmail}>
            <Text style={styles.buttonTitle}>{'Contact via Email'}</Text>
          </TouchableOpacity>
          {!!CONTACT_DETAILS.telegram && (
            <>
              <Text style={styles.descriptions}>{'OR'}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={openSupportTelegram}>
                <Text style={styles.buttonTitle}>{'Contact via Telegram'}</Text>
              </TouchableOpacity>
            </>
          )}
          {!!supportId && (
            <TouchableOpacity onPress={onPressSupportId}>
              <Text style={styles.descriptions}>
                {`Support ID: ${supportId} (tap to copy)`}
              </Text>
            </TouchableOpacity>
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
