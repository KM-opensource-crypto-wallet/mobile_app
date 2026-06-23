import React, {
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ModalAddressPoisoningWarningStyles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {getCommonAffixLengths} from 'dok-wallet-blockchain-networks/helper/addressPoisoning';

// Danger accent used for the warning — brand-neutral so it reads correctly in
// both dokwallet (orange) and kimlwallet (blue) themes.
const DANGER = '#E5484D';

const ModalAddressPoisoningWarning = ({
  visible,
  suspiciousAddress,
  matchedAddress,
  onContinue,
  onCancel,
}) => {
  const {theme} = useContext(ThemeContext);
  const [checked, setChecked] = useState(false);
  const styles = myStyles(theme);

  // Reset the acknowledgement each time the modal is reopened.
  useEffect(() => {
    if (visible) {
      setChecked(false);
    }
  }, [visible]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleContinue = useCallback(() => {
    if (checked) {
      onContinue?.();
    }
  }, [checked, onContinue]);

  const handleCheckBox = useCallback(() => {
    setChecked(prev => !prev);
  }, []);

  // The actual overlap between the two addresses — usually longer than the
  // detection threshold, so highlight exactly what a scammer made match.
  const {prefixLength, suffixLength} = useMemo(
    () => getCommonAffixLengths(suspiciousAddress, matchedAddress),
    [suspiciousAddress, matchedAddress],
  );

  // Render an address with its matching prefix/suffix highlighted — this is the
  // part a poisoning attacker copies, so showing it teaches the user what to check.
  const renderAddress = useCallback(
    address => {
      if (
        typeof address !== 'string' ||
        address.length <= prefixLength + suffixLength
      ) {
        return <Text style={styles.addressText}>{address}</Text>;
      }
      const prefix = address.slice(0, prefixLength);
      const middle = address.slice(prefixLength, address.length - suffixLength);
      const suffix = suffixLength ? address.slice(-suffixLength) : '';
      return (
        <Text style={styles.addressText} selectable>
          <Text style={styles.addressHighlight}>{prefix}</Text>
          {middle}
          <Text style={styles.addressHighlight}>{suffix}</Text>
        </Text>
      );
    },
    [prefixLength, suffixLength, styles.addressText, styles.addressHighlight],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons
                name="shield-alert-outline"
                size={34}
                color={DANGER}
              />
            </View>

            <Text style={styles.title}>{'Possible Address Poisoning'}</Text>
            <Text style={styles.subtitle}>
              {
                'This address closely resembles one you used before, but it is not the same. Scammers plant lookalike addresses to redirect your funds.'
              }
            </Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="history"
                  size={16}
                  color={theme.gray}
                />
                <Text style={styles.cardLabel}>{'Previously used'}</Text>
              </View>
              {renderAddress(matchedAddress)}
            </View>

            <View style={[styles.card, styles.cardDanger]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color={DANGER}
                />
                <Text style={[styles.cardLabel, styles.cardLabelDanger]}>
                  {'New recipient'}
                </Text>
              </View>
              {renderAddress(suspiciousAddress)}
            </View>

            <View style={styles.tipRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={theme.gray}
              />
              <Text style={styles.tipText}>
                {
                  'Only the highlighted start and end match — always verify the middle characters too.'
                }
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={handleCheckBox}
              activeOpacity={0.7}>
              <MaterialCommunityIcons
                name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={checked ? theme.background : theme.gray}
              />
              <Text style={styles.checkboxText}>
                {'I understand the risk and want to continue'}
              </Text>
            </TouchableOpacity>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={handleCancel}
                activeOpacity={0.8}>
                <Text style={styles.cancelText}>{'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!checked}
                style={[
                  styles.btn,
                  styles.continueBtn,
                  !checked && styles.continueBtnDisabled,
                ]}
                onPress={handleContinue}
                activeOpacity={0.8}>
                <Text style={styles.continueText}>{'Continue'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ModalAddressPoisoningWarning;
