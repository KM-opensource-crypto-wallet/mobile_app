import React, {useContext, useState} from 'react';
import {Modal, View, Text, TouchableOpacity} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import BigNumber from 'bignumber.js';
import Toast from 'react-native-toast-message';
import {ThemeContext} from 'theme/ThemeContext';
import {currencySymbol} from 'data/currency';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {
  checkBatchDelegation,
  revokeDelegation,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import myStyles from 'components/ModalDelegation/ModalDelegationStyles';

const feeText = (notice, localCurrency) => {
  if (notice?.estimatedFee == null) {
    return 'A small network fee applies.';
  }
  const fee = new BigNumber(notice.estimatedFee);
  const fiat = notice.currencyRate
    ? fee.multipliedBy(notice.currencyRate)
    : null;
  const symbol = currencySymbol[localCurrency] || '';
  const fiatText =
    fiat == null
      ? ''
      : fiat.lt(0.01)
      ? ` (< ${symbol}0.01)`
      : ` (~${symbol}${fiat.toFixed(2)})`;
  return `Network fee ≈ ${fee.decimalPlaces(8, BigNumber.ROUND_UP).toFixed()} ${
    notice.chain_symbol
  }${fiatText}`;
};

// Asks a listed account (checkBatchDelegation) to remove its batch-sending
// delegation on Ethereum.
const ModalBatchDelegation = ({notice, onClose}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const localCurrency = useSelector(getLocalCurrency);
  const [isRemoving, setIsRemoving] = useState(false);

  const onTurnOff = async () => {
    setIsRemoving(true);
    try {
      const {status} = await dispatch(
        revokeDelegation({coinId: notice.coinId}),
      ).unwrap();
      Toast.show(
        status === 'pending'
          ? {
              type: 'successToast',
              text1: 'Removal submitted',
              text2: 'It should finish within a minute.',
            }
          : {type: 'successToast', text1: 'Batch sending switched off'},
      );
      onClose();
      // Marks the address as done once the chain shows the delegation gone.
      dispatch(checkBatchDelegation({force: true}));
    } catch (e) {
      Toast.show({
        type: 'errorToast',
        text1: 'Failed to switch off batch sending',
        text2: e?.message,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Modal
      visible={!!notice}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {'Recommended: switch off batch sending'}
          </Text>
          <Text style={styles.message}>
            {
              "Your Ethereum account is still set up for batch sending from when you last used that feature. We've paused batch sending while we upgrade it, and as a precaution we recommend switching it off. It takes one quick transaction.\n\nTip: only sign messages from sites you trust."
            }
          </Text>
          <Text style={styles.message}>{feeText(notice, localCurrency)}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onClose}
              disabled={isRemoving}>
              <Text style={styles.secondaryBtnText}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtnInRow}
              onPress={onTurnOff}
              disabled={isRemoving}>
              <Text style={styles.primaryBtnText}>
                {isRemoving ? 'Turning off...' : 'Turn off now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ModalBatchDelegation;
