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
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import {selectBtcLightningUnClaimed} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';

export const BtcLightningUnclaimedData = ({onDismiss}) => {
  const [activeRejectIndex, setActiveRejectIndex] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [addressValidationError, setAddressValidationError] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const unClaimedData = useSelector(selectBtcLightningUnClaimed);
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
          onDismiss();
        }
        setLoadingIndex(null);
      } catch (error) {
        console.log('error:', error);
        setLoadingIndex(null);
      }
    },
    [currentCoin?.chain_name, currentPhrase, onDismiss],
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
          onDismiss();
        }
        setLoadingIndex(null);
      } catch (error) {
        console.log('error:', error);
        setLoadingIndex(null);
      }
    },
    [currentCoin?.chain_name, currentPhrase, destinationAddress, onDismiss],
  );

  const trimTxId = txid => {
    if (!txid) return '';

    return `${txid.slice(0, 6)}........${txid.slice(-6)}`;
  };

  const renderItem = ({item, index}) => {
    const showInput = activeRejectIndex === index;
    return (
      <View style={styles.card}>
        {loadingIndex === index ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size={'large'}
              animating={true}
              color={theme.background}
            />
            <Text style={styles.loadingText}>Processing transaction...</Text>
          </View>
        ) : (
          <>
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <IoniconIcon
                name="time-outline"
                size={16}
                color={theme.warningBottom}
              />
              <Text style={styles.statusText}>Pending Claim</Text>
            </View>

            {/* Amount Section - Primary Focus */}
            <View style={styles.amountSection}>
              <View style={styles.amountIconContainer}>
                <IoniconIcon
                  name="logo-bitcoin"
                  size={32}
                  color={theme.background}
                />
              </View>
              <View style={styles.amountDetails}>
                <Text style={styles.amountLabel}>Amount to Claim</Text>
                <Text style={styles.amountValue}>{item.amount} BTC</Text>
              </View>
            </View>

            {/* Transaction Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <View style={styles.infoLabelRow}>
                  <IoniconIcon
                    name="document-text-outline"
                    size={16}
                    color={theme.gray}
                  />
                  <Text style={styles.infoLabel}>Transaction ID</Text>
                </View>
                <Text style={styles.infoValue}>{trimTxId(item.txid)}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoLabelRow}>
                  <IoniconIcon
                    name="layers-outline"
                    size={16}
                    color={theme.gray}
                  />
                  <Text style={styles.infoLabel}>Output Index</Text>
                </View>
                <Text style={styles.infoValue}>#{item.vout || 0}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Address Input Section */}
            {showInput ? (
              <View style={styles.refundSection}>
                <View style={styles.refundHeader}>
                  <IoniconIcon
                    name="wallet-outline"
                    size={20}
                    color={theme.font}
                  />
                  <Text style={styles.refundTitle}>Refund Destination</Text>
                </View>
                <Text style={styles.refundDescription}>
                  Enter the Bitcoin address where you want to receive the refund
                </Text>

                <TextInput
                  style={styles.textInputStyle}
                  placeholder="Bitcoin address"
                  placeholderTextColor={theme.gray}
                  value={destinationAddress}
                  onChangeText={setDestinationAddress}
                  mode="outlined"
                  outlineColor={theme.whiteOutline}
                  activeOutlineColor={theme.background}
                  textColor={theme.font}
                />

                {addressValidationError && (
                  <View style={styles.errorContainer}>
                    <IoniconIcon
                      name="alert-circle"
                      size={16}
                      color="#e60000"
                    />
                    <Text style={styles.errorText}>
                      Invalid Bitcoin address
                    </Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.buttonSecondary, styles.shadow]}
                    onPress={() => handleCancel(item, index)}>
                    <IoniconIcon
                      name="close-outline"
                      size={20}
                      color={theme.font}
                    />
                    <Text style={styles.buttonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.buttonPrimary, styles.shadow]}
                    onPress={() => handleRefund(item, index)}>
                    <IoniconIcon
                      name="return-up-back-outline"
                      size={20}
                      color={theme.title}
                    />
                    <Text style={styles.buttonPrimaryText}>Refund</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.buttonSecondary, styles.shadow]}
                  onPress={() => handleReject(index)}>
                  <IoniconIcon
                    name="close-circle-outline"
                    size={20}
                    color={theme.font}
                  />
                  <Text style={styles.buttonSecondaryText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.buttonPrimary, styles.shadow]}
                  onPress={() => handleApprove(item, index)}>
                  <IoniconIcon
                    name="checkmark-circle-outline"
                    size={20}
                    color={theme.title}
                  />
                  <Text style={styles.buttonPrimaryText}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    );
  };
  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerIconWrapper}>
        <IoniconIcon name="flash-outline" size={28} color={theme.background} />
      </View>
      <Text style={styles.headerTitle}>Lightning Claims</Text>
      <Text style={styles.headerSubtitle}>
        Review and manage your pending Bitcoin Lightning claims
      </Text>
      {unClaimedData?.length > 0 && (
        <View style={styles.claimsCountBadge}>
          <Text style={styles.claimsCountText}>
            {unClaimedData.length}{' '}
            {unClaimedData.length === 1 ? 'Claim' : 'Claims'} Pending
          </Text>
        </View>
      )}
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <IoniconIcon
          name="checkmark-done-circle-outline"
          size={64}
          color={theme.gray}
        />
      </View>
      <Text style={styles.emptyTitle}>No Pending Claims</Text>
      <Text style={styles.emptyDescription}>
        You don't have any unclaimed Lightning transactions at the moment.
      </Text>
    </View>
  );

  return (
    <FlatList
      data={unClaimedData}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.txid}-${index}`}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};
