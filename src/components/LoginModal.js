import React from 'react';
import {Modal, StyleSheet} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import LoginComponent from 'components/LoginComponent';
import Toasts from 'components/Toasts';

const LoginModal = ({visible, onClose}) => {
  return (
    <Modal
      visible={visible}
      animated={true}
      animationType={'slide'}
      statusBarTranslucent={true}>
      {/* An RN Modal is its own window, so none of the roots in
          components/main.js reach inside it - the gesture root and the bottom
          sheet provider have to be re-established here, same as PaperProvider. */}
      <GestureHandlerRootView style={styles.root}>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent={false}>
          <BottomSheetModalProvider>
            <PaperProvider>
              <LoginComponent onClose={onClose} visible={visible} />
              <Toasts />
            </PaperProvider>
          </BottomSheetModalProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({root: {flex: 1}});

export default LoginModal;
