import React, {useContext, useCallback} from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import myStyles, {WARN} from './ConfirmationModalStyles';

/**
 * Generic confirmation modal with a warning icon, title, subtitle,
 * optional info card and confirm/dismiss buttons. The confirm button
 * is styled as destructive (outlined danger), the dismiss button as
 * the safe default.
 */
const ConfirmationModal = ({
  visible,
  title,
  subtitle,
  infoText,
  icon = 'alert-circle-outline',
  infoIcon = 'clock-alert-outline',
  confirmLabel = 'Confirm',
  dismissLabel = 'Cancel',
  onConfirm,
  onDismiss,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
  }, [onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name={icon} size={34} color={WARN} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {!!infoText && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons
                name={infoIcon}
                size={18}
                color={theme.gray}
              />
              <Text style={styles.infoText}>{infoText}</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={handleConfirm}
              activeOpacity={0.8}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.dismissBtn]}
              onPress={handleDismiss}
              activeOpacity={0.8}>
              <Text style={styles.dismissText}>{dismissLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;
