import React, { useCallback, useContext, useMemo, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { getWalletConnect } from 'dok-wallet-blockchain-networks/service/walletconnect';
import { getSdkError } from '@walletconnect/utils';
import { resetWalletConnect } from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSlice';
import {
  removeAllWalletConnectSession,
  removeWalletConnectSession,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  selectWalletConnectData,
  selectWalletConnectSessions,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import { ThemeContext } from '../theme/ThemeContext';
import { clearWalletConnectStorageCache } from '../utils/asyncStorage';

const WalletConnectItem = ({ onClose }) => {
  const sessions = useSelector(selectWalletConnectSessions, shallowEqual);
  const walletData = useSelector(selectWalletConnectData, shallowEqual);
  const [deletingSession, setDeletingSession] = useState([]);
  const allSessions = useMemo(() => {
    const sessionKeys = Object.keys(sessions);
    let finalData = [];
    sessionKeys.forEach(item => {
      let tempSession = sessions[item];
      tempSession = { ...tempSession, chainData: walletData[item] };
      finalData.push(tempSession);
    });
    return finalData;
  }, [sessions, walletData]);

  const { theme } = useContext(ThemeContext);
  const styles = MyStyles(theme);
  const dispatch = useDispatch();

  const onPressDisconnect = useCallback(
    async (sessionId, topic) => {
      try {
        setDeletingSession(prevState => [...prevState, sessionId]);
        const walletConnect = getWalletConnect();
        // if (walletConnect[sessionId]) {
        await walletConnect.disconnectSession({
          topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });

        if (allSessions.length === 1) {
          onClose && onClose();
          dispatch(resetWalletConnect());
          sessionId && dispatch(removeAllWalletConnectSession());
          clearWalletConnectStorageCache().then();
        } else {
          dispatch(removeWalletConnectSession(sessionId));
        }
        setDeletingSession(prevState =>
          prevState.filter(item => item !== sessionId),
        );
        // }
      } catch (e) {
        dispatch(resetWalletConnect());
        dispatch(removeAllWalletConnectSession());
        setDeletingSession(prevState =>
          prevState.filter(item => item !== sessionId),
        );
        console.error('Error in disconnect', e);
      }
    },
    [allSessions.length, dispatch, onClose],
  );

  return allSessions.map((item, index) => {
    const metadata = item?.peer?.metadata;
    const icon = metadata?.icons[0] || '';
    const chainData = Array.isArray(item?.chainData) ? item?.chainData : [];
    const isDeleting = deletingSession.includes(item.pairingTopic);
    return (
      <View style={styles.itemView} key={'' + item.key + index}>
        <View style={styles.rowView}>
          <FastImage source={{ uri: icon }} style={styles.rowImageStyle} />
          <View style={styles.centerItemView}>
            <Text style={styles.title}>{`${metadata?.name}`}</Text>
            <Text numberOfLines={1} style={styles.url}>
              {metadata?.url}
            </Text>
          </View>
        </View>
        <Text style={[styles.title, { marginTop: 20 }]}>{'Chains'}</Text>
        {chainData?.map((chain, i) => (
          <View style={styles.chainRowView} key={'' + chain?._id + i}>
            <FastImage
              source={{ uri: chain?.icon }}
              style={styles.rowImageStyle}
            />
            <View style={styles.centerItemView}>
              <Text
                style={styles.itemTitle}>{`${chain?.chain_display_name}`}</Text>
              <Text numberOfLines={1} style={styles.url}>
                {chain?.address}
              </Text>
            </View>
          </View>
        ))}
        <TouchableOpacity
          disabled={isDeleting}
          style={styles.buttonStyle}
          onPress={() => {
            onPressDisconnect(item.pairingTopic, item.topic).then();
          }}>
          {isDeleting ? (
            <ActivityIndicator color={'red'} />
          ) : (
            <Text style={styles.errorTitle}>{'Disconnect App'}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  });
};
const MyStyles = theme =>
  StyleSheet.create({
    itemView: {
      marginTop: 20,
      borderRadius: 8,
      borderColor: theme.gray,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      // height: 60,
    },
    rowView: {
      alignItems: 'center',
      flexDirection: 'row',
      width: '100%',
    },
    chainRowView: {
      alignItems: 'center',
      flexDirection: 'row',
      width: '100%',
      borderColor: theme.gray,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 8,
      borderRadius: 8,
    },
    rowImageStyle: {
      height: 30,
      width: 30,
      resizeMode: 'contain',
      marginRight: 8,
      borderRadius: 8,
    },
    title: {
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.primary,
    },
    buttonStyle: {
      height: 44,
      borderWidth: 1,
      borderColor: 'red',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    },
    errorTitle: {
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      fontSize: 16,
      color: 'red',
    },
    itemTitle: {
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.primary,
    },
    url: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.primary,
      fontFamily: 'Roboto-Regular',
    },
    centerItemView: {
      justifyContent: 'space-between',
      flex: 1,
    },
  });
export default WalletConnectItem;
