import React, {useContext} from 'react';
import {Dimensions, TouchableOpacity, View, StyleSheet} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import FastImage from '@d11/react-native-fast-image';
import {ThemeContext} from 'theme/ThemeContext';
import {DRIVE_GUIDE_IMG} from '../../utils/wlData';

const {width} = Dimensions.get('window');
const MODAL_WIDTH = width * 0.85;

const DriveGuideModal = ({visible, onContinue}) => {
  const {theme} = useContext(ThemeContext);

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={[
          styles.modalContainer,
          {backgroundColor: theme.secondaryBackgroundColor},
        ]}
        dismissable={false}>
        <View style={styles.content}>
          <Text style={[styles.title, {color: theme.font}]}>
            Important Step!
          </Text>
          <Text style={[styles.description, {color: theme.gray}]}>
            When signing in with Google, please make sure to CHECK the box to
            allow the app to access its own folder in your Google Drive.
          </Text>

          <View style={styles.imageContainer}>
            <FastImage
              source={DRIVE_GUIDE_IMG}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: theme.background || '#007bff'},
            ]}
            onPress={onContinue}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>I Understand, Continue</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    width: MODAL_WIDTH,
    alignSelf: 'center',
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 285,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  image: {
    width: '95%',
    height: '95%',
    borderRadius: 30,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DriveGuideModal;
