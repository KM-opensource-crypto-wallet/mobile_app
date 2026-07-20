import React, {useContext, useCallback} from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import myStyles, {WARN} from './CoinSyncDiscardModalStyles';

const CoinSyncDiscardModal = ({
  visible,
  coinCount = 0,
  walletName,
  onDiscard,
  onStay,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const handleStay = useCallback(() => {
    onStay?.();
  }, [onStay]);

  const handleDiscard = useCallback(() => {
    onDiscard?.();
  }, [onDiscard]);

  const isSingle = coinCount === 1;
  const coinWord = isSingle ? 'coin' : 'coins';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleStay}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={34}
              color={WARN}
            />
          </View>

          <Text style={styles.title}>
            {`Discard ${coinCount} found ${coinWord}?`}
          </Text>
          <Text style={styles.subtitle}>
            {`We found ${coinCount} ${coinWord} with a balance${
              walletName ? ` in "${walletName}"` : ''
            }. Going back now removes ${
              isSingle ? 'it' : 'them'
            } from this scan without adding ${
              isSingle ? 'it' : 'them'
            } to your wallet.`}
          </Text>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="clock-alert-outline"
              size={18}
              color={theme.gray}
            />
            <Text style={styles.infoText}>
              {
                "Scanning is limited to once every 24 hours, so you won't be able to rescan this wallet until tomorrow."
              }
            </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.discardBtn]}
              onPress={handleDiscard}
              activeOpacity={0.8}>
              <Text style={styles.discardText}>{'Discard'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.stayBtn]}
              onPress={handleStay}
              activeOpacity={0.8}>
              <Text style={styles.stayText}>{'Stay'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CoinSyncDiscardModal;
