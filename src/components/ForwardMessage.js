import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, FlatList} from 'react-native';

import {ThemeContext} from 'theme/ThemeContext';
import ConversationItem from 'components/ConversationItem';
import EmptyView from 'components/EmptyView';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {getConversations} from 'dok-wallet-blockchain-networks/redux/messages/messageSelector';
import {forwardMessages} from '../../dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const ForwardMessage = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const conversations = useSelector(getConversations, shallowEqual);
  const dispatch = useDispatch();
  const [selectedConversation, setSelectedConversation] = useState({});
  const messages = route.params.messages;

  const isConversationSelected = useMemo(() => {
    return !!Object.keys(selectedConversation).length;
  }, [selectedConversation]);

  const filterConversations = useMemo(() => {
    return conversations?.filter(conversation => {
      return conversation.consentState === 'allowed';
    });
  }, [conversations]);

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressCancel = useCallback(() => {
    navigation.navigate('MessageList');
  }, [navigation]);

  const onPressConversation = useCallback(
    currentConversation => {
      const conversationId = currentConversation?.topic;
      const isSelected = !!selectedConversation[conversationId];
      const previousSelectedConversations = {...selectedConversation};
      if (isSelected) {
        delete previousSelectedConversations[conversationId];
      } else {
        previousSelectedConversations[conversationId] = currentConversation;
      }
      setSelectedConversation(previousSelectedConversations);
    },
    [selectedConversation],
  );

  const onPressForward = useCallback(() => {
    const selectedConversations = Object.values(selectedConversation);
    dispatch(forwardMessages({messages, conversations: selectedConversations}));
    navigation.navigate('MessageList');
  }, [dispatch, messages, navigation, selectedConversation]);

  return (
    <DokSafeAreaView style={styles.modalStyle}>
      <View style={styles.mainView}>
        <View style={styles.headerView}>
          <TouchableOpacity onPress={onPressCancel}>
            <Text style={styles.buttonTitle}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Forward Messages</Text>
          {isConversationSelected ? (
            <TouchableOpacity onPress={onPressForward}>
              <Text style={styles.buttonTitle}>Forward</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonTitle} />
          )}
        </View>
        <FlatList
          contentContainerStyle={styles.contentContainerStyle}
          data={filterConversations}
          renderItem={({item, index}) => (
            <ConversationItem
              item={item}
              index={index}
              isCheckbox={true}
              onPressConversation={onPressConversation}
              selectedConversation={selectedConversation}
            />
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          getItemLayout={(data, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
          style={styles.container}
          ListEmptyComponent={<EmptyView text={'No Messages is available'} />}
          keyExtractor={item => item.topic}
          extraData={selectedConversation}
        />
      </View>
    </DokSafeAreaView>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    modalStyle: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    mainView: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 24,
      paddingTop: 10,
      width: '100%',
      height: '100%',
      alignItems: 'center',
      flex: 1,
    },
    headerView: {
      width: '100%',
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomColor: theme.headerBorder,
      borderBottomWidth: 1,
      gap: 8,
      paddingLeft: 11,
      paddingRight: 8,
      justifyContent: 'space-between',
    },
    title: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.borderActiveColor,
    },
    buttonTitle: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.background,
      width: 70,
    },
  });
export default ForwardMessage;
