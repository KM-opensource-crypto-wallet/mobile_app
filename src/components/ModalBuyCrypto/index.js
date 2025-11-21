import React, {useState, useEffect, useContext} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Text} from 'react-native-paper';
import myStyles from './ModalBuyCryptoStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {source} from 'deprecated-react-native-prop-types/DeprecatedImagePropType';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';
import {WL_APP_NAME} from 'utils/wlData';

const WIDTH = Dimensions.get('window').width + 80;
const ITEM_WIDTH = Math.round(WIDTH * 0.7);
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 3;

const ModalBuyCrypto = ({visible, hideModal, navigation, cryptoProvider}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const containerStyle = {
    backgroundColor: theme.secondaryBackgroundColor,
    width: ITEM_WIDTH,
    alignSelf: 'center',
    borderRadius: 10,
    height: modalHeight,
  };

  return (
    <Modal
      visible={visible}
      contentContainerStyle={containerStyle}
      dismissable={false}>
      <View style={styles.infoList}>
        <Text style={styles.titleInfo}>
          {`Your ${WL_APP_NAME}'s address was copied to clipboard.`}
        </Text>
        <Text style={styles.infoBox}>
          <Text style={styles.info}>
            Simply paste it when asked by {cryptoProvider?.title?.toLowerCase()}
          </Text>
        </Text>
        <Text style={styles.info}>
          **Please double check when purchasing for the first time.
        </Text>
      </View>

      <View style={styles.buttonList}>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            hideModal(false);
            const url = cryptoProvider.uri;
            const isAvailable = await InAppBrowser.isAvailable();
            if (isAvailable) {
              await InAppBrowser.open(url, inAppBrowserOptions);
            }
          }}>
          <Text style={styles.buttonTitle}>Ok</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ModalBuyCrypto;
