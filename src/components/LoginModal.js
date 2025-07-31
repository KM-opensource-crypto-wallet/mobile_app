import React from 'react';
import {Modal} from 'react-native';
import LoginComponent from 'components/LoginComponent';

const LoginModal = ({visible, onClose}) => {
  return (
    <Modal
      visible={visible}
      animated={true}
      animationType={'slide'}
      statusBarTranslucent={true}>
      <LoginComponent onClose={onClose} visible={visible} />
    </Modal>
  );
};

export default LoginModal;
