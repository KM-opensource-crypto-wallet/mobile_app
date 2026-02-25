import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Bubble,
  Composer,
  GiftedChat,
  InputToolbar,
  Send,
} from 'react-native-gifted-chat';
import {KeyboardAvoidingView, Text, TouchableOpacity, View} from 'react-native';
import myStyles from 'screens/main/Home/Message/MessageStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {isContainsURL} from 'dok-wallet-blockchain-networks/helper';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {
  getMessage,
  getMoreMessages,
  addSentMessage,
} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {
  getMessageData,
  getSelectedConversations,
  isAllMessageLoaded,
  isFetchingMessages,
  isFetchingMoreMessages,
} from 'dok-wallet-blockchain-networks/redux/messages/messageSelector';
import Loading from 'components/Loading';
import {XMTP} from 'utils/xmtp';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {parseUrlQS, validatePaymentUrl} from 'utils/common';
import {setPaymentData} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';
import {showToast} from 'utils/toast';
import {getMessageAllowUrls} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {useIsFocused} from '@react-navigation/native';
import {IS_ANDROID} from 'utils/dimensions';
import {setAdjustPan, setAdjustNothing} from 'rn-android-keyboard-adjust';

import Clipboard from '@react-native-clipboard/clipboard';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import MessageHeader from 'components/MessageHeader';
import MessagePopover from 'components/MessagePopover';
import Icon from 'react-native-vector-icons/FontAwesome6';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import DialogReplyFail from 'components/DialogReplyFail';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {useHeaderHeight} from '@react-navigation/elements';
import Checkbox from 'components/Checkbox';

const Message = ({navigation}) => {
  const headerHeight = useHeaderHeight();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const conversation = useSelector(getSelectedConversations, shallowEqual);
  let user = {
    _id: XMTP.client?.inboxId,
  };
  const dispatch = useDispatch();
  const messageData = useSelector(getMessageData);
  const isFetchingMsg = useSelector(isFetchingMessages);
  const isFetchingMoreMsg = useSelector(isFetchingMoreMessages);
  const messageAllowUrls = useSelector(getMessageAllowUrls);
  const isAllMsgLoaded = useSelector(isAllMessageLoaded);
  const isFocused = useIsFocused();
  const [pendingScrollMessageId, setPendingScrollMessageId] = useState(null);
  const messages = useMemo(() => {
    const raw = messageData[conversation?.topic] || [];
    const seen = new Set();
    return raw
      .filter(msg => {
        if (seen.has(msg._id)) {
          return false;
        }
        seen.add(msg._id);
        return true;
      })
      .map(msg => ({
        ...msg,
        text: typeof msg.text === 'string' ? msg.text : '',
        repliedMessage:
          typeof msg.repliedMessage === 'string' ? msg.repliedMessage : '',
      }));
  }, [conversation?.topic, messageData]);
  const [conversationObj, setConversationObj] = useState(null);
  const [text, setText] = useState('');
  const [isErrorInMessage, setIsErrorInMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const {bottom} = useSafeAreaInsets();
  const [isMultiSelectEnable, setIsMultiSelectEnable] = useState(false);
  const isMultiSelectedEnableRef = useRef(false);
  const messageContainerRef = useRef(null);
  const [selectedMessages, setSelectedMessages] = useState({});
  const selectedMessageRef = useRef({});
  const checkboxContainerWidth = useSharedValue(0); // initial width
  const checkboxPosition = useSharedValue(-40); // initial width
  const popoverRef = useRef({});
  const [replyMessage, setReplyMessage] = useState(null);
  const replyMessageRef = useRef(null);
  const conversationObjRef = useRef(null);
  const [blinkingMessageId, setBlinkingMessageId] = useState(null);
  const blinkOpacity = useSharedValue(1);
  const [dialogVisible, setDialogVisible] = useState(false);

  const messagesById = useMemo(() => {
    const map = new Map();
    messages.forEach(m => map.set(m._id, m));
    return map;
  }, [messages]);

  useAnimatedStyle(() => {
    return {
      width: withTiming(checkboxContainerWidth.value, {
        duration: 250,
      }),
    };
  });

  useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(checkboxPosition.value, {
            duration: 250,
          }),
        },
      ],
    };
  });

  useEffect(() => {
    if (IS_ANDROID) {
      if (isFocused) {
        setAdjustNothing();
      } else {
        setAdjustPan();
      }
    }
  }, [isFocused]);

  useEffect(() => {
    replyMessageRef.current = replyMessage;
  }, [replyMessage]);

  useEffect(() => {
    if (!conversation?.topic) {
      return;
    }
    dispatch(getMessage({topic: conversation?.topic}));
    XMTP.getConversation({
      topic: conversation?.topic,
      peerAddress: conversation?.peerAddress,
      createdAt: conversation?.createdAt,
      version: conversation?.version,
    }).then(conv => {
      setConversationObj(conv);
      conversationObjRef.current = conv;
    });
  }, [
    conversation?.createdAt,
    conversation?.peerAddress,
    conversation?.topic,
    conversation?.version,
    dispatch,
  ]);

  const onSend = useCallback(
    async (outgoingMessages = []) => {
      try {
        const messageText = outgoingMessages[0]?.text?.trim();
        if (!messageText || isErrorInMessage) {
          return;
        }
        setIsSending(true);
        setIsErrorInMessage(false);
        const currentReply = replyMessageRef.current;
        let resp;
        if (currentReply) {
          resp = await XMTP.sendReply({
            topic: conversation?.topic,
            replyData: {
              repliedMessage: currentReply?.text,
              repliedMessageId: currentReply?._id,
              message: messageText,
              senderAddress: currentReply?.user?._id,
            },
          });
        } else {
          resp = await XMTP.sendMessage({
            topic: conversation?.topic,
            message: messageText,
          });
        }
        setIsSending(false);
        setText('');
        if (resp) {
          const newMessage = {
            _id: resp,
            text: messageText,
            createdAt: new Date().toISOString(),
            user: {_id: XMTP.client?.inboxId},
            ...(currentReply && {
              reference: currentReply?._id,
              repliedMessage: currentReply?.text,
              repliedUserId: currentReply?.user?._id,
            }),
          };
          dispatch(
            addSentMessage({topic: conversation?.topic, message: newMessage}),
          );
          setReplyMessage(null);
        } else {
          console.error('resp not get', resp);
          showToast({
            type: 'errorToast',
            title: 'Something went wrong',
          });
        }
      } catch (e) {
        console.error('Error in sending message', e);
        setIsSending(false);
        showToast({
          type: 'errorToast',
          title: 'Something went wrong',
        });
      }
    },
    [conversation?.topic, dispatch, isErrorInMessage],
  );

  const onLoadMoreMessages = useCallback(() => {
    const messsageLength = messages.length;
    const lastMessage = messages[messsageLength - 1];
    const lastMessageDate = new Date(lastMessage?.createdAt);
    dispatch(getMoreMessages({lastMessageDate, topic: conversation.topic}));
  }, [conversation.topic, dispatch, messages]);

  const triggerBlinkForMessage = useCallback(
    messageId => {
      setBlinkingMessageId(messageId);
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, {duration: 200}),
          withTiming(1, {duration: 200}),
        ),
        2,
        true,
        finished => {
          if (finished) {
            runOnJS(setBlinkingMessageId)(null);
            blinkOpacity.value = 1;
          }
        },
      );
    },
    [blinkOpacity],
  );

  const scrollToMessage = useCallback(
    messageId => {
      const messageIndex = messages.findIndex(item => item._id === messageId);
      if (messageIndex !== -1 && messageContainerRef.current) {
        messageContainerRef.current.scrollToIndex({
          index: messageIndex,
          animated: true,
        });
        setTimeout(() => {
          triggerBlinkForMessage(messageId);
        }, 500);
        return true;
      } else {
        return false;
      }
    },
    [messages, triggerBlinkForMessage],
  );

  const onPressRepliedMessage = useCallback(
    async currentMessage => {
      const isScrolled = scrollToMessage(currentMessage?.reference);
      if (!isScrolled) {
        const messageLength = messages.length;
        const lastMessage = messages[messageLength - 1];
        const lastMessageDate = new Date(lastMessage?.createdAt);
        setPendingScrollMessageId(currentMessage?.reference);
        dispatch(
          getMoreMessages({
            topic: conversation.topic,
            lastMessageDate,
            limit: 100,
          }),
        );
      }
    },
    [dispatch, conversation.topic, messages, scrollToMessage],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: blinkOpacity.value,
    };
  });

  useEffect(() => {
    if (pendingScrollMessageId) {
      setTimeout(() => {
        const resp = scrollToMessage(pendingScrollMessageId);
        if (!resp) {
          setDialogVisible(true);
        }
        setPendingScrollMessageId(null);
      }, 500); //Adding delay to make sure the message is loaded in ref
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const onPressMessage = useCallback(
    currentMessage => {
      const messageId = currentMessage?._id;
      const isSelected = !!selectedMessages[messageId];
      const previousSelectedMessages = {...selectedMessageRef.current};
      if (isSelected) {
        delete previousSelectedMessages[messageId];
      } else {
        previousSelectedMessages[messageId] = currentMessage;
      }
      selectedMessageRef.current = previousSelectedMessages;
      setSelectedMessages(previousSelectedMessages);
    },
    [selectedMessages],
  );

  const onPressSingleReply = useCallback(currentMessage => {
    setReplyMessage(currentMessage);
  }, []);

  const onLongPressMessage = useCallback(
    currentMessage => {
      checkboxContainerWidth.value = 40;
      checkboxPosition.value = 0;
      isMultiSelectedEnableRef.current = true;
      setIsMultiSelectEnable(true);
      onPressMessage(currentMessage);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onPressMessage],
  );

  const onPressClose = useCallback(
    () => {
      checkboxContainerWidth.value = 0;
      checkboxPosition.value = -40;
      isMultiSelectedEnableRef.current = false;
      setIsMultiSelectEnable(false);
      setSelectedMessages({});
      selectedMessageRef.current = {};
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onPressCopy = useCallback(() => {
    const selectedMessagesValues = Object.values(selectedMessages);
    const sortedMessages = selectedMessagesValues.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
    let copyString = '';
    const sortedMessageLength = sortedMessages.length;
    for (let i = 0; i < sortedMessageLength; i++) {
      const message = sortedMessages[i];
      const previousMessage = sortedMessages[i - 1];
      const currentUserId = message?.user?._id;
      const prevUserid = previousMessage?.user?._id;
      const currentMessage = message?.text;
      if (
        (i === 0 && sortedMessageLength > 1) ||
        (previousMessage && currentUserId !== prevUserid)
      ) {
        copyString += `${currentUserId}:\n`;
      }
      copyString += `${currentMessage}\n\n`;
    }
    Clipboard.setString(copyString);
    triggerHapticFeedbackLight();
  }, [selectedMessages]);

  const onPressSingleCopy = useCallback(message => {
    if (message?.text) {
      Clipboard.setString(message?.text);
      triggerHapticFeedbackLight();
    }
  }, []);

  const onPressSingleForward = useCallback(
    message => {
      if (message?.text) {
        navigation.navigate('ForwardMessage', {
          messages: [message?.text],
        });
      }
    },
    [navigation],
  );

  const onPressForward = useCallback(() => {
    const selectedMessagesValues = Object.values(selectedMessages);
    const sortedMessages = selectedMessagesValues.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    navigation.navigate('ForwardMessage', {
      messages: sortedMessages.map(item => item.text),
    });
  }, [navigation, selectedMessages]);

  const onChangeText = useCallback(
    localText => {
      setIsErrorInMessage(isContainsURL(localText, messageAllowUrls));
      setText(localText);
    },
    [messageAllowUrls],
  );

  const onShouldUpdateMessage = useCallback(
    (props, nextProps) => {
      return (
        JSON.stringify(props.currentMessage) !==
          JSON.stringify(nextProps.currentMessage) ||
        isMultiSelectEnable !== isMultiSelectedEnableRef.current ||
        blinkingMessageId !== null ||
        !!selectedMessageRef.current[props.currentMessage._id] !==
          !!selectedMessages[nextProps.currentMessage._id]
      );
    },
    [blinkingMessageId, isMultiSelectEnable, selectedMessages],
  );

  const onPressUrl = useCallback(
    url => {
      try {
        const qsObj = parseUrlQS(url);
        if (validatePaymentUrl(url, qsObj)) {
          const currentDate = new Date().toISOString();
          dispatch(setPaymentData({...qsObj, date: currentDate}));
        }
      } catch (e) {
        console.warn('error in getInitialUrlLink', e);
      }
    },
    [dispatch],
  );

  const checkboxWidthStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(checkboxContainerWidth.value, {
        duration: 250, // duration of the animation
      }),
    };
  });

  const checkboxPositionStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(checkboxPosition.value, {
            duration: 250, // duration of the animation
          }),
        },
      ],
    };
  });

  const onRenderBubble = useCallback(
    props => {
      const isLeft = props.position === 'left';
      const currentMessage = props.currentMessage;
      const messageId = currentMessage?._id;
      const isSelected = !!selectedMessages[messageId];
      // const isBlinking = ;
      // console.log('messageId', messageId, currentMessage.text);

      return (
        <Animated.View
          style={[
            styles.rowView,
            {paddingLeft: 0},
            messageId === blinkingMessageId && animatedStyle,
          ]}>
          <TouchableOpacity
            activeOpacity={0.6}
            style={[styles.rowView, isLeft && {paddingLeft: 0}]}
            onLongPress={() => onLongPressMessage(currentMessage)}
            onPress={() => onPressMessage(currentMessage)}>
            {isSelected && (
              <Animated.View style={[{height: 32}, checkboxWidthStyle]}>
                <Animated.View style={[checkboxPositionStyle]}>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onPressMessage(currentMessage)}
                  />
                </Animated.View>
              </Animated.View>
            )}
            <MessagePopover
              onRef={ref => (popoverRef.current[messageId] = ref)}
              isLeft={isLeft}
              onPressSingleForward={() => {
                onPressSingleForward(currentMessage);
              }}
              onPressSingleCopy={() => {
                onPressSingleCopy(currentMessage);
              }}
              onPressSingleReply={() => {
                onPressSingleReply(currentMessage);
              }}
            />
            <Bubble
              {...props}
              renderCustomView={() => {
                const reference = currentMessage?.reference;
                const directRepliedText = currentMessage?.repliedMessage;
                const lookupMsg =
                  !directRepliedText && reference
                    ? messagesById.get(reference) ?? null
                    : null;
                const repliedText = directRepliedText || lookupMsg?.text || '';
                const repliedUserId =
                  currentMessage?.repliedUserId || lookupMsg?.user?._id;
                return repliedText ? (
                  <TouchableOpacity
                    onPress={() => onPressRepliedMessage(currentMessage)}>
                    <View style={styles.replyContainerMessage}>
                      <Text>
                        {repliedUserId === conversation?.clientAddress
                          ? 'You'
                          : 'Other'}
                      </Text>
                      <Text>{repliedText}</Text>
                    </View>
                  </TouchableOpacity>
                ) : null;
              }}
              containerStyle={{
                ...props.containerStyle,
              }}
              onPressMessage={() => {
                if (isMultiSelectEnable) {
                  onPressMessage(currentMessage);
                } else {
                  popoverRef.current[messageId].open();
                }
              }}
              onLongPressMessage={() => onLongPressMessage(currentMessage)}
            />
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [
      animatedStyle,
      blinkingMessageId,
      checkboxPositionStyle,
      checkboxWidthStyle,
      conversation?.clientAddress,
      isMultiSelectEnable,
      messagesById,
      onLongPressMessage,
      onPressMessage,
      onPressRepliedMessage,
      onPressSingleCopy,
      onPressSingleForward,
      onPressSingleReply,
      selectedMessages,
      styles.replyContainerMessage,
      styles.rowView,
    ],
  );

  const onRenderSend = useCallback(
    sendProps => (
      <Send
        {...sendProps}
        label={isSending ? 'Sending' : 'Send'}
        textStyle={{
          color: isErrorInMessage || isSending ? theme.gray : '#0084ff',
          backgroundColor: theme.backgroundColor,
        }}
        sendButtonProps={{disabled: isErrorInMessage || isSending}}
      />
    ),
    [isErrorInMessage, isSending, theme.backgroundColor, theme.gray],
  );

  const onRenderChatFooter = useCallback(() => {
    return replyMessage ? (
      <View style={styles.replyToContainer}>
        <View style={styles.replyToContainerHeader}>
          <Text style={styles.replyToContainerHeaderText}>Reply to</Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.replyToContainerMessageText}>
            {replyMessage?.text}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReplyMessage(null)}>
          <Icon name="xmark" size={16} color={theme.gray} />
        </TouchableOpacity>
      </View>
    ) : null;
  }, [
    replyMessage,
    styles.replyToContainer,
    styles.replyToContainerHeader,
    styles.replyToContainerHeaderText,
    styles.replyToContainerMessageText,
    theme.gray,
  ]);

  const onRenderInputToolbar = useCallback(
    props => (
      <InputToolbar
        {...props}
        containerStyle={{backgroundColor: theme.backgroundColor}}
      />
    ),
    [theme.backgroundColor],
  );

  const onRenderComposer = useCallback(
    composerProps => (
      <Composer
        {...composerProps}
        textInputProps={{
          ...composerProps.textInputProps,
          placeholderTextColor: theme.gray,
          style: {
            color: theme.font,
            backgroundColor: theme.backgroundColor,
          },
        }}
      />
    ),
    [theme.backgroundColor, theme.font, theme.gray],
  );

  let listViewProps = {extraData: isMultiSelectEnable};
  if (!conversation) {
    return null;
  }

  return (
    <DokSafeAreaView style={styles.container}>
      <MessageHeader
        conversation={conversation}
        selectedMessages={selectedMessages}
        isMultiSelectEnable={isMultiSelectEnable}
        onPressClose={onPressClose}
        onPressCopy={onPressCopy}
        onPressForward={onPressForward}
      />
      {isFetchingMsg ? (
        <Loading />
      ) : conversation?.consentState === 'denied' ? (
        <View style={styles.centerContainer}>
          <Text style={styles.blockText}>
            {
              "This user is blocked by you. So, you can't see any messages. If you want to see the messages or send the messages. Unblock the user"
            }
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior="padding"
          keyboardVerticalOffset={IS_ANDROID ? 0 : headerHeight}>
          <GiftedChat
            messages={messages}
            onSend={onSend}
            textInputProps={{onChangeText}}
            user={user}
            isKeyboardInternallyHandled={false}
            messageContainerRef={messageContainerRef}
            renderAvatar={null}
            onLoadEarlier={onLoadMoreMessages}
            isLoadingEarlier={isFetchingMoreMsg}
            listViewProps={listViewProps}
            infiniteScroll={true}
            shouldUpdateMessage={onShouldUpdateMessage}
            onPressUrl={onPressUrl}
            renderBubble={onRenderBubble}
            bottomOffset={bottom}
            loadEarlier={!isAllMsgLoaded}
            renderSend={onRenderSend}
            {...(isErrorInMessage && {
              renderAccessory: () => (
                <View style={styles.messageErrorContainer}>
                  <Text style={styles.errorText}>
                    {'Unknown link(s) are not allow to send'}
                  </Text>
                </View>
              ),
            })}
            renderChatFooter={onRenderChatFooter}
            renderInputToolbar={onRenderInputToolbar}
            renderComposer={onRenderComposer}
          />
        </KeyboardAvoidingView>
      )}
      <DialogReplyFail
        visible={dialogVisible}
        hideDialog={setDialogVisible}
        message="The message is too old and can't be redirected to."
      />
    </DokSafeAreaView>
  );
};
export default Message;
