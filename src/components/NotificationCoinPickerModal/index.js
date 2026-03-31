import React, {memo, useContext} from 'react';
import {View, Text, Modal, TouchableOpacity, ScrollView} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import myStyles from './NotificationCoinPickerModalStyles';
import {coinKey} from 'utils/notificationAlertHelpers';

const NotificationCoinPickerModal = ({
  visible,
  selectedCoinEntries,
  configCoinKey,
  onSelect,
  onDismiss,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Coin to Configure</Text>
          <ScrollView bounces={false}>
            {selectedCoinEntries.map(entry => {
              const key = coinKey(entry.walletClientId, entry.coin._id);
              const isActive = key === configCoinKey;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.modalOption,
                    isActive && styles.modalOptionActive,
                  ]}
                  onPress={() => onSelect(key)}>
                  <CoinIcon item={entry.coin} />
                  <View style={styles.flexOne}>
                    <Text style={styles.coinSymbol}>{entry.coin.symbol}</Text>
                    <Text style={styles.coinName}>{entry.walletName}</Text>
                  </View>
                  {isActive && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={theme.background}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.modalCancel} onPress={onDismiss}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default memo(NotificationCoinPickerModal);
