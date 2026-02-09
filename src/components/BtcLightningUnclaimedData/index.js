import {useCallback, useContext, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import myStyles from './BtcLightningUnclaimedDataStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {
  getCurrentWalletPhrase,
  selectCurrentCoin,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {useSelector} from 'react-redux';
import {BitcoinLightningChain} from 'dok-wallet-blockchain-networks/cryptoChain/chains/BitcoinLightningChain';
import {ActivityIndicator, TextInput} from 'react-native-paper';
import * as bitcoin from 'bitcoinjs-lib';
import {config} from 'dok-wallet-blockchain-networks/config/config';

export const BtcLightningUnclaimedData = ({unClaimedData}) => {
  const [activeRejectIndex, setActiveRejectIndex] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [addressValidationError, setAddressValidationError] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const currentPhrase = useSelector(getCurrentWalletPhrase);

  const handleApprove = useCallback(
    async (item, index) => {
      try {
        setLoadingIndex(index);
        const lightningChain = await BitcoinLightningChain(
          currentCoin?.chain_name,
          currentPhrase,
        );
        const response = await lightningChain.approveClaimedBtc(
          item.txid,
          item.vout,
        );
        if (response) {
        }
        setLoadingIndex(null);
      } catch (error) {
        console.log('error:', error);
        setLoadingIndex(null);
      }
    },
    [currentCoin?.chain_name, currentPhrase],
  );

  const handleReject = useCallback(index => {
    setActiveRejectIndex(index);
  }, []);

  const handleCancel = useCallback((item, index) => {
    setActiveRejectIndex(null);
    setDestinationAddress('');
    setAddressValidationError(false);
  }, []);

  const isValidBTCAddress = (address, network) => {
    try {
      bitcoin.address.toOutputScript(address, network);
      return true;
    } catch {
      return false;
    }
  };

  const handleRefund = useCallback(
    async (item, index) => {
      try {
        setLoadingIndex(index);
        const {txid, amount, vout} = item;
        if (
          !isValidBTCAddress(destinationAddress, config.BITCOIN_NETWORK_STRING)
        ) {
          setAddressValidationError(true);
          setLoadingIndex(null);
          return;
        }
        setAddressValidationError(false);
        const lightningChain = await BitcoinLightningChain(
          currentCoin?.chain_name,
          currentPhrase,
        );
        const response = await lightningChain.rejectClaimRequest(
          txid,
          vout,
          destinationAddress,
        );
        if (response) {
          // Refresh page
        }
        setLoadingIndex(null);
      } catch (error) {
        console.log('error:', error);
        setLoadingIndex(null);
      }
    },
    [currentCoin?.chain_name, currentPhrase, destinationAddress],
  );

  const trimTxId = txid => {
    if (!txid) return '';

    return `${txid.slice(0, 6)}........${txid.slice(-6)}`;
  };

  const renderItem = ({item, index}) => {
    const showInput = activeRejectIndex === index;
    return (
      <>
        <View style={styles.card}>
          {loadingIndex === index ? (
            <ActivityIndicator size={'small'} animating={true} />
          ) : (
            <>
              {/* Info Section */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>TXID</Text>
                <Text style={styles.txid}>{trimTxId(item.txid)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Amount</Text>
                <Text style={styles.amount}>{item.amount} BTC</Text>
              </View>
              {/* Address Input Section */}
              {showInput && (
                <>
                  <Text style={styles.addressLabel}>Destination Address</Text>

                  <TextInput
                    style={styles.textInputStyle}
                    value={destinationAddress}
                    onChangeText={setDestinationAddress}
                  />

                  {addressValidationError && (
                    <Text style={styles.errorText}>* InValid Address</Text>
                  )}

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.shadow]}
                      onPress={() => handleCancel(item, index)}>
                      <Text style={styles.btnText}>CANCEL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.shadow]}
                      onPress={() => handleRefund(item, index)}>
                      <Text style={styles.btnText}>REFUND</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Approve / Reject Buttons */}
              {!showInput && (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.shadow]}
                    onPress={() => handleReject(index)}>
                    <Text style={styles.btnText}>REJECT</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.shadow]}
                    onPress={() => handleApprove(item, index)}>
                    <Text style={styles.btnText}>APPROVE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </>
    );
  };
  return <FlatList data={unClaimedData} renderItem={renderItem} />;
};
