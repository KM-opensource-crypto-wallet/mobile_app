import React, {useState, useContext} from 'react';
import {
  Dimensions,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from 'react-native';
import {Text} from 'react-native-paper';
import Warning from 'assets/images/verify/warning.svg';
import CryptoCheckbox from 'components/CryptoCheckbox';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './VerifyInfoStyles';
import {useNavigation} from '@react-navigation/native';

export const WIDTH = Dimensions.get('window').width + 80;
const isIpad = Platform.OS === 'ios' && WIDTH >= 768;
let ITEM_WIDTH;
if (isIpad) {
  ITEM_WIDTH = (WIDTH - 80) / 2;
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.75);
}

export const VerifyInfoModal = ({visible, onClose}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const navigation = useNavigation();
  const [infoCheck, setInfoCheck] = useState(false);

  const containerStyle = {
    backgroundColor: theme.secondaryBackgroundColor,
    padding: 20,
    width: ITEM_WIDTH,
    alignSelf: 'center',
    borderRadius: 10,
  };

  return (
    <Modal
      visible={visible}
      statusBarTranslucent={true}
      dismissable={false}
      transparent={true}
      onDismiss={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: 'rgba(52, 52, 52, 0.8)',
        }}>
        <View style={containerStyle}>
          <View style={styles.icon}>
            <Warning fill={theme.backgroundColor} />
          </View>

          <Text style={styles.title}>Important!</Text>
          <Text style={styles.info}>
            Your account is ready. We used a &nbsp;
            <Text style={styles.span}>seed phrase </Text> to create the private
            key with which you control your funds.
          </Text>
          <Text style={styles.infoNext}>
            It is very important that you keep the &nbsp;
            <Text style={styles.span}>seed phrase </Text> somewhere safe,
            outside of this device.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Learn')}>
            <Text style={styles.learnText}>Learn more.</Text>
          </TouchableOpacity>
          <Text style={styles.infoRed}>
            IMPORTANT:We do not keep your private key in our servers. It is
            encrypted and stored on this device. If you lose the private key,
            you will lose access to your funds! The &nbsp;
            <Text style={styles.spanRed}>seed phrase </Text> is the only means
            by which you can restore your key.
          </Text>

          <CryptoCheckbox
            setInfoCheck={setInfoCheck}
            number={'3'}
            title={'I understand'}
          />

          <TouchableOpacity
            disabled={!infoCheck}
            style={{
              ...styles.btnVerify,
              backgroundColor: infoCheck ? theme.background : '#708090',
            }}
            onPress={() => {
              onClose();
              navigation.navigate('VerifyCreate');
            }}>
            <Text style={styles.verifyTitle}>Verify seed phrase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!infoCheck}
            style={styles.btnLater}
            onPress={() => {
              onClose();
            }}>
            <Text
              style={{
                ...styles.laterTitle,
                color: infoCheck ? theme.background : '#708090',
              }}>
              Do it later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
