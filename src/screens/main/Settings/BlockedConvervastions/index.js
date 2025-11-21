import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {FlatList, View, TouchableOpacity, Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {
  getConversations,
  isFetchingConversations,
} from 'dok-wallet-blockchain-networks/redux/messages/messageSelector';
import {
  getConversation,
  updateConsentState,
} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import EmptyView from 'components/EmptyView';
import myStyles from './BlockConversationStyles';
import Loading from 'components/Loading';
import {getCustomizePublicAddress} from 'dok-wallet-blockchain-networks/helper';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const BlockedConversations = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const conversations = useSelector(getConversations, shallowEqual);
  const isFetchingConv = useSelector(isFetchingConversations);
  const dispatch = useDispatch();
  const isRefreshing = useRef(false);

  const filterConversations = useMemo(() => {
    return conversations?.filter(conversation => {
      return conversation.consentState === 'denied';
    });
  }, [conversations]);

  const fetchConversations = useCallback(
    isMain => {
      if (!isMain) {
        isRefreshing.current = true;
      }
      dispatch(getConversation());
    },
    [dispatch],
  );

  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        {isFetchingConv && !isRefreshing.current ? (
          <Loading />
        ) : (
          <FlatList
            contentContainerStyle={styles.contentContainerStyle}
            data={filterConversations}
            renderItem={({item, index}) => (
              <View style={styles.itemView}>
                <View style={styles.subView}>
                  <View style={styles.subRowView}>
                    <Text
                      style={styles.headerTitle}>{`${getCustomizePublicAddress(
                      item?.peerAddress,
                    )}`}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.blockButton}
                  onPress={() => {
                    isRefreshing.current = true;
                    dispatch(
                      updateConsentState({
                        peerAddress: item?.peerAddress,
                        topic: item?.topic,
                        address: item?.clientAddress,
                        consentState: 'allowed',
                      }),
                    );
                  }}>
                  <Text style={styles.buttonTitle}>Unblock</Text>
                </TouchableOpacity>
              </View>
            )}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            getItemLayout={(data, index) => ({
              length: 60,
              offset: 60 * index,
              index,
            })}
            style={styles.container}
            onRefresh={fetchConversations}
            refreshing={isFetchingConv}
            ListEmptyComponent={EmptyView({
              text: 'No blocked addresses is available',
            })}
          />
        )}
      </View>
    </DokSafeAreaView>
  );
};

export default BlockedConversations;
