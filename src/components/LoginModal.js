import React from 'react';
import {Modal} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import LoginComponent from 'components/LoginComponent';
import Toasts from 'components/Toasts';

const LoginModal = ({visible, onClose}) => {
  return (
    <Modal
      visible={visible}
      animated={true}
      animationType={'slide'}
      statusBarTranslucent={true}>
      <PaperProvider>
        <LoginComponent onClose={onClose} visible={visible} />
        <Toasts />
      </PaperProvider>
    </Modal>
  );
};

export default LoginModal;
