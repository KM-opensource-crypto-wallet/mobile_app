import React, {useCallback, useContext, useMemo} from 'react';
import {FlatList, View, StyleSheet} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {
  getConversations,
  isFetchingConversations,
} from 'dok-wallet-blockchain-networks/redux/messages/messageSelector';
import ConversationItem from 'components/ConversationItem';
import {getConversation} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import EmptyView from 'components/EmptyView';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const Conversations = ({isRequest}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const conversations = useSelector(getConversations, shallowEqual);
  const isFetchingConv = useSelector(isFetchingConversations);
  const dispatch = useDispatch();

  const filterConversations = useMemo(() => {
    return conversations?.filter(conversation => {
      return isRequest
        ? conversation.consentState === 'unknown'
        : conversation.consentState === 'allowed';
    });
  }, [conversations, isRequest]);

  const fetchConversations = useCallback(() => {
    dispatch(getConversation());
  }, [dispatch]);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <FlatList
          contentContainerStyle={styles.contentContainerStyle}
          data={filterConversations}
          renderItem={({item, index}) => (
            <ConversationItem item={item} index={index} />
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
            text: `No ${isRequest ? 'Requests' : 'Messages'} is available`,
          })}
        />
      </View>
    </DokSafeAreaView>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainerStyle: {
      flexGrow: 1,
    },
  });

export default Conversations;
