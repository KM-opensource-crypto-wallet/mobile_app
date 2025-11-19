import React, { useContext } from 'react';
import { Dimensions, TouchableOpacity, View, Linking } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { ThemeContext } from '../../theme/ThemeContext';
import myStyles from './ModalAppUpdates';
import { IS_IOS } from '../utils/dimensions';
import { getBundleId } from 'react-native-device-info';
import { IOS_APPSTORE_URL, WL_APP_NAME } from '../../../src/utils/wlData';

const WIDTH = Dimensions.get('window').width + 80;
const { height: screenHeight } = Dimensions.get('window');
const modalHeight = screenHeight / 2.5;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalAppUpdate = ({ visible }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={{
          backgroundColor: theme.secondaryBackgroundColor,
          width: ITEM_WIDTH,
          alignSelf: 'center',
          borderRadius: 10,
        }}
        dismissable={false}>
        <View style={styles.infoList}>
          <Text style={styles.titleInfo}>{'New Updates Available!'}</Text>
          <Text style={styles.info}>
            {`There is a new version of the ${WL_APP_NAME} available on the ${
              IS_IOS ? 'App Store' : 'Play Store'
            }
Please update it to continue using app.`}
          </Text>
        </View>
        <View style={styles.btnList}>
          <TouchableOpacity
            style={styles.learnBox}
            onPress={async () => {
              try {
                const link = IS_IOS
                  ? IOS_APPSTORE_URL
                  : `https://play.google.com/store/apps/details?id=${getBundleId()}`;
                await Linking.openURL(link);
              } catch (e) {
                console.error('Error in click of update', e);
              }
            }}>
            <Text style={styles.learnText}>Update</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalAppUpdate;
