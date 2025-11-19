import React, {useContext} from 'react';
import {Dimensions, TouchableOpacity, View, Linking} from 'react-native';
import {Modal, Portal, Text} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalApkDownload';
import {WL_APP_NAME} from 'utils/wlData';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalApkDownload = ({visible}) => {
  const {theme} = useContext(ThemeContext);
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
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="cloud-download"
              size={60}
              color={theme.primary || '#4CAF50'}
            />
          </View>
          <Text style={styles.titleInfo}>{'New Update Available!'}</Text>
          <Text style={styles.info}>
            {`A new version of ${WL_APP_NAME} is available. Please download and install the latest APK to continue using the app.`}
          </Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionRow}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="globe-outline"
                  size={22}
                  color={theme.primary || '#4CAF50'}
                />
              </View>
              <Text style={styles.instructionItem}>
                {'Tap "Open Kimlwallet" button below to visit kimlwallet.com'}
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons
                  name="download"
                  size={22}
                  color={theme.primary || '#4CAF50'}
                />
              </View>
              <Text style={styles.instructionItem}>
                {'On the website, locate and tap the "Download APK" button'}
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.iconWrapper}>
                <FontAwesome
                  name="folder-open"
                  size={20}
                  color={theme.primary || '#4CAF50'}
                />
              </View>
              <Text style={styles.instructionItem}>
                {
                  'Once the APK is downloaded, locate it in your Downloads folder'
                }
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="settings-outline"
                  size={22}
                  color={theme.primary || '#4CAF50'}
                />
              </View>
              <Text style={styles.instructionItem}>
                {
                  'Enable "Install from Unknown Sources" in your device settings if prompted'
                }
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color={theme.primary || '#4CAF50'}
                />
              </View>
              <Text style={styles.instructionItem}>
                {
                  'Open the downloaded APK file and follow the installation prompts'
                }
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.btnList}>
          <TouchableOpacity
            style={styles.learnBox}
            onPress={async () => {
              try {
                const link = 'https://kimlwallet.com';
                await Linking.openURL(link);
              } catch (e) {
                console.error('Error opening kimlwallet.com', e);
              }
            }}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="open-in-new"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.learnText}>Open Kimlwallet</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalApkDownload;
