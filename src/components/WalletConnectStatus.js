import React, {useContext, useMemo, useRef} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {shallowEqual, useSelector} from 'react-redux';
import {selectWalletConnectSessions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import WalletConnectList from 'components/WalletConnectList';
import {useWalletConnectSessionRestore} from 'hooks/useWalletConnectSessionRestore';

const WalletConnectStatus = () => {
  const {theme} = useContext(ThemeContext);
  const sessions = useSelector(selectWalletConnectSessions, shallowEqual);
  const allSessionKeys = useMemo(() => {
    return Object.keys(sessions);
  }, [sessions]);
  const walletConnectListRef = useRef();

  // Listeners for sessions restored from the previous run; re-runs once
  // WalletKit has initialised (which on a cold launch is after this mounts).
  useWalletConnectSessionRestore();

  const styles = MyStyles(theme);
  return allSessionKeys.length ? (
    <>
      <WalletConnectList
        onDismiss={() => {
          walletConnectListRef?.current?.close();
        }}
        bottomSheetRef={ref => (walletConnectListRef.current = ref)}
      />
      <TouchableOpacity
        style={[styles.mainView, {zIndex: 1}]}
        onPress={() => {
          walletConnectListRef.current.close();
          walletConnectListRef.current.present();
        }}>
        <Text style={styles.textView}>{`${allSessionKeys.length} App${
          allSessionKeys.length > 1 ? 's' : ''
        } connected`}</Text>
      </TouchableOpacity>
    </>
  ) : null;
};
const MyStyles = theme =>
  StyleSheet.create({
    mainView: {
      paddingHorizontal: 20,
      position: 'absolute',
      alignSelf: 'center',
      bottom: 80,
      paddingVertical: 12,
      backgroundColor: theme.background,
      borderRadius: 4,
      zIndex: 11,
    },
    textView: {
      color: theme.backgroundColor,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
  });
export default WalletConnectStatus;
