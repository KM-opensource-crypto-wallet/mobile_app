import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {getDisableMessage} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {SafeAreaView} from 'react-native-safe-area-context';
import {openSupportEmail, openSupportTelegram} from 'utils/contactSupport';
import {getSupportId} from 'services/logger';

const DisableComponent = () => {
  const disableMessage = useSelector(getDisableMessage);
  const supportId = getSupportId();

  return (
    <>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.text}>{disableMessage}</Text>
        </ScrollView>

        <View style={styles.bottomView}>
          <View>
            <Text style={styles.description}>
              For more information. Please contact us on via{' '}
              <Text style={styles.link} onPress={openSupportEmail}>
                {'Email'}
              </Text>{' '}
              or{' '}
              <Text style={styles.link} onPress={openSupportTelegram}>
                {'Telegram'}
              </Text>{' '}
              for additional support.
            </Text>
            {!!supportId && (
              <Text style={styles.supportId} selectable>
                {`Support ID: ${supportId}`}
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>
      <SafeAreaView style={{backgroundColor: 'lightgray'}} />
    </>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 14,
    color: 'black',
    fontWeight: '500',
  },
  bottomView: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'lightgray',
  },
  description: {
    fontSize: 14,
    color: 'black',
  },
  link: {
    fontSize: 14,
    color: 'blue',
    textDecorationLine: 'underline',
  },
  supportId: {
    fontSize: 14,
    color: 'black',
    marginTop: 12,
  },
  deleteButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  deleteText: {
    fontSize: 16,
    color: 'red',
  },
});
export default DisableComponent;
