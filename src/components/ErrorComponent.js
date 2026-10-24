// Delete.js
import React, {useCallback, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ModalDeleteData from 'components/ModalDeteletData';
import {SafeAreaView} from 'react-native-safe-area-context';
import {openSupportEmail, openSupportTelegram} from 'utils/contactSupport';
import {getSupportId} from 'services/logger';

const ErrorComponent = () => {
  const [count, setCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const onPressCount = useCallback(() => {
    setCount(prevState => prevState + 1);
  }, []);

  const supportId = getSupportId();

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
            <Text style={styles.link} onPress={openSupportEmail}>
              {'Email'}
            </Text>{' '}
            or{' '}
            <Text style={styles.link} onPress={openSupportTelegram}>
              {'Telegram'}
            </Text>{' '}
            for additional support.
          </Text>
        </TouchableWithoutFeedback>
        {!!supportId && (
          <Text style={styles.supportId} selectable>
            {`Support ID: ${supportId}`}
          </Text>
        )}
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
export default ErrorComponent;
