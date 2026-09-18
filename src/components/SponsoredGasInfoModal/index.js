import React, {useContext} from 'react';
import {Modal, View, Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './SponsoredGasInfoModalStyles';

const SponsoredGasInfoModal = ({
  visible,
  tokenSymbol,
  maxFeeDisplay,
  onClose,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const symbol = tokenSymbol || 'stablecoin';

  const bullets = [
    maxFeeDisplay
      ? `You pay the gas fee up to ${maxFeeDisplay} ${symbol} plus a 10% service fee for this transaction.`
      : 'You pay the gas fee up to estimated fee plus 10% service fee for this transaction.',
    'The total shows as the Estimated Fee before you confirm',
    'Your transfer and the fee are sent together, so if one fails neither happens.',
    `Your ${symbol} balance has to cover both the amount you send and the fee.`,
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{`Pay gas fees with ${symbol}`}</Text>
          <Text style={styles.message}>
            {`Normally you need the network's own coin to pay the gas fee. With this on, we pay it for you and take the cost back in ${symbol}.`}
          </Text>
          <View style={styles.bulletList}>
            {bullets.map(bullet => (
              <View style={styles.bulletRow} key={bullet}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
            <Text style={styles.primaryBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SponsoredGasInfoModal;
