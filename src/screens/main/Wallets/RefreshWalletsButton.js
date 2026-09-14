import React, {useCallback, useContext} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';

import {ThemeContext} from 'theme/ThemeContext';
import {selectIsRefreshingAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {refreshAllWalletsCoins} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {showToast} from 'utils/toast';

// Button that refreshes the balances of every visible wallet, one wallet at
// a time. Reads its own loading state so the parent does not re-render on
// every tick. `style` lets the caller size/frame it for its slot; `color`
// is the icon/spinner color (default: the brand accent's white foreground).
const RefreshWalletsButton = ({style, color}) => {
  const {theme} = useContext(ThemeContext);
  const iconColor = color || theme.title;
  const dispatch = useDispatch();
  const isRefreshing = useSelector(selectIsRefreshingAllWallets);

  const onPress = useCallback(async () => {
    Keyboard.dismiss();
    try {
      const result = await dispatch(refreshAllWalletsCoins()).unwrap();
      if (result?.failed > 0) {
        showToast({
          type: 'warningToast',
          title: 'Some balances were not refreshed',
          message: `${result.failed} of ${result.total} wallets could not be updated. Please try again.`,
        });
      }
    } catch (e) {
      // A run already in flight rejects via the thunk `condition`; the
      // button is disabled in that case, so anything here is a real failure.
      showToast({
        type: 'errorToast',
        title: 'Refresh failed',
        message: 'Could not refresh wallet balances. Please try again.',
      });
    }
  }, [dispatch]);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      activeOpacity={0.5}
      disabled={isRefreshing}
      accessibilityRole="button"
      accessibilityLabel="Refresh all wallet balances"
      accessibilityState={{busy: isRefreshing, disabled: isRefreshing}}
      onPress={onPress}>
      {isRefreshing ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <IoniconsIcon name="refresh-outline" size={22} color={iconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RefreshWalletsButton;
