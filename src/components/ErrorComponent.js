// Delete.js
import React, { useCallback, useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ModalDeleteData from 'components/ModalDeteletData';
import { CONTACT_DETAILS } from 'utils/wlData';
import { SafeAreaView } from 'react-native-safe-area-context';

const ErrorComponent = () => {
  const [count, setCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const onPressCount = useCallback(() => {
    setCount(prevState => prevState + 1);
  }, []);

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
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <Text style={styles.text}>{'Something went wrong'}</Text>
      </View>
      <View style={styles.bottomView}>
        <TouchableWithoutFeedback onPress={onPressCount}>
          <Text style={styles.description}>
            This crash report is already submitted. Try to close and reopen the
            app. Please contact us on via{' '}
            <Text style={styles.link} onPress={onPressContactViaEmail}>
              {'Email'}
            </Text>{' '}
            or{' '}
            <Text style={styles.link} onPress={onPressContactViaTelegram}>
              {'Telegram'}
            </Text>{' '}
            for additional support.
          </Text>
        </TouchableWithoutFeedback>
        {count >= 5 && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setShowModal(true);
            }}>
            <Text style={styles.deleteText}>Delete all data</Text>
          </TouchableOpacity>
        )}
        <ModalDeleteData
          visible={showModal}
          hideModal={() => {
            setShowModal(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    color: 'black',
  },
  bottomView: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
export default ErrorComponent;
