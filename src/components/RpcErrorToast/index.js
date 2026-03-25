import React, {useCallback, useContext} from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {MainNavigation} from 'utils/navigation';
import myStyles from './RpcErrorToastStyles';
import {useDispatch, useSelector} from 'react-redux';
import {deleteCustomRpc} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSlice';
import {
  selectCoinsForCurrentWallet,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {selectCustomRpcUrlByChainAndWallet} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSelectors';

const RpcErrorToast = ({
  visible,
  chain_name,
  chainDisplayName,
  hasCustomRpc,
  onDismiss,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const currentWallet = useSelector(selectCurrentWallet);
  const walletCoins = useSelector(selectCoinsForCurrentWallet);
  const customRpcUrl = useSelector(
    selectCustomRpcUrlByChainAndWallet(chain_name, currentWallet?.clientId),
  );

  const nativeCoin = walletCoins.find(
    c => c?.chain_name === chain_name && c?.type === 'coin',
  );
  const displayName =
    chainDisplayName ||
    nativeCoin?.chain_display_name ||
    nativeCoin?.name ||
    chain_name;

  const onPressChangeRpc = useCallback(() => {
    onDismiss?.();
    MainNavigation.navigate({
      name: 'AddCustomRPC',
      params: {chain_name, chain_display_name: displayName},
    });
  }, [onDismiss, chain_name, displayName]);

  const onPressUseDefault = useCallback(() => {
    dispatch(
      deleteCustomRpc({chain_name, walletClientId: currentWallet?.clientId}),
    );
    onDismiss?.();
  }, [chain_name, currentWallet?.clientId, dispatch, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconPanel}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="server-network-off"
              size={22}
              color="#FF4444"
            />
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.titleRow}>
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>RPC Error</Text>
            </View>
            <Text style={styles.chainName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>

          <Text style={styles.message} numberOfLines={3}>
            {hasCustomRpc
              ? `Custom RPC is not responding. Revert to the default endpoint?\n${customRpcUrl}`
              : 'Default RPC is not responding. Set a custom RPC endpoint.'}
          </Text>

          <View style={styles.actionsRow}>
            {hasCustomRpc ? (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onPressUseDefault}
                  activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>Use Default</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onPressChangeRpc}
                  activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>Change RPC</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onPressChangeRpc}
                activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>Set Custom RPC</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onDismiss}
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
          <MaterialCommunityIcons name="close" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBorder} />
    </View>
  );
};

export default RpcErrorToast;
