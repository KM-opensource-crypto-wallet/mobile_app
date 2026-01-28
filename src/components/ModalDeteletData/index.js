import React from 'react';
import {TouchableOpacity, View, Text, Modal} from 'react-native';

import styles from './ModalDeleteData';
import {persistor} from 'redux/store';
import RNRestart from 'react-native-restart';
import googleDrive from '../../utils/googleDriveBackup';

const ModalDeleteData = ({visible, hideModal}) => {
  const handlerNo = () => {
    hideModal();
  };

  const handlerYes = async () => {
    try {
      hideModal();
      await persistor.purge();
      await googleDrive.googleSignOut();
      RNRestart.restart();
    } catch (e) {
      console.error('Error in delete data', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent={true}
      style={{backgroundColor: 'transparent'}}>
      <View style={styles.modalView}>
        <View style={styles.anotherContainerView}>
          <View style={styles.infoList}>
            <Text style={styles.titleInfo}>{'Delete All Data?'}</Text>
            <Text style={styles.info}>
              Please make sure you have a copy of 12/18/24-word seed phrase. You
              will need it in order to restore your wallet. Without it you will
              NOT be able to restore your wallet and you will lose access to
              your funds. This will delete all your data.
            </Text>
            <Text style={styles.info}>Are you sure you want to proceed?</Text>
          </View>
          <View style={styles.btnList}>
            <View style={styles.learnBorder}>
              <TouchableOpacity
                style={styles.learnBox}
                onPress={() => handlerNo()}>
                <Text style={styles.learnText}>No</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.learnBox}
              onPress={() => handlerYes()}>
              <Text style={styles.learnText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ModalDeleteData;
