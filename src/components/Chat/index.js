import {useContext, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {TextInput} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ThemeContext} from 'theme/ThemeContext';
import {IS_IOS, SCREEN_WIDTH} from 'utils/dimensions';

function formatTime(isoString) {
  const date = new Date(isoString);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
}

export const Chat = ({userMessages = [], onSend, clientAddress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // DokSafeAreaView already handles the bottom safe area edge.
  // We only need the inset value as a keyboardVerticalOffset for iOS KAV.
  const {bottom: safeAreaBottom} = useSafeAreaInsets();
  const [inputMessage, setInputMessage] = useState('');
  const [pendingMessages, setPendingMessages] = useState([]);

  // Remove a pending message once it appears confirmed in userMessages
  useEffect(() => {
    if (pendingMessages.length === 0) {
      return;
    }
    const myLatest = userMessages.find(m => m.user?._id === clientAddress);
    if (!myLatest) {
      return;
    }
    const latestDate = new Date(myLatest.createdAt);
    setPendingMessages(prev =>
      prev.filter(p => new Date(p.createdAt) > latestDate),
    );
  }, [userMessages, clientAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge pending (shown instantly) with server messages (newest-first for inverted list)
  const displayMessages = useMemo(
    () => [...pendingMessages, ...userMessages],
    [pendingMessages, userMessages],
  );

  function sendMessage() {
    if (!inputMessage.trim()) {
      return;
    }
    const optimistic = {
      _id: `pending_${Date.now()}`,
      text: inputMessage,
      createdAt: new Date().toISOString(),
      user: {_id: clientAddress},
    };
    setPendingMessages(prev => [optimistic, ...prev]);
    onSend([{text: inputMessage}]);
    setInputMessage('');
  }

  const isMine = item => item.user?._id === clientAddress;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={IS_IOS ? 'padding' : undefined}
      keyboardVerticalOffset={IS_IOS ? safeAreaBottom : 0}>
      <View style={styles.chatContainer}>
        <FlatList
          showsVerticalScrollIndicator={false}
          inverted
          data={displayMessages}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.messageList}
          renderItem={({item}) => {
            const mine = isMine(item);
            return (
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.messageRow,
                    mine ? styles.messageRowRight : styles.messageRowLeft,
                  ]}>
                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.myBubble : styles.theirBubble,
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        mine ? styles.myMessageText : styles.theirMessageText,
                      ]}>
                      {item.text}
                    </Text>
                    <Text
                      style={[
                        styles.timeText,
                        mine ? styles.myTimeText : styles.theirTimeText,
                      ]}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            );
          }}
        />
      </View>

      <View style={styles.inputWrapper}>
        <View style={styles.inputRow}>
          <View style={styles.inputPill}>
            <TextInput
              accessibilityLabel="Text input field"
              placeholder="Type a message..."
              placeholderTextColor={theme.gray}
              multiline
              textColor={theme.font}
              cursorColor={theme.background}
              selectionColor={theme.background}
              outlineColor="transparent"
              activeOutlineColor="transparent"
              style={styles.textInput}
              contentStyle={styles.textContent}
              autoCapitalize="sentences"
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={sendMessage}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.sendButton,
              inputMessage.trim()
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={sendMessage}
            disabled={!inputMessage.trim()}>
            <Text
              style={[
                styles.sendArrow,
                inputMessage.trim() && styles.sendArrowActive,
              ]}>
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = theme =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    // Chat area
    chatContainer: {
      flex: 1,
      backgroundColor: theme.lightBackground,
    },
    messageList: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    // Message rows
    messageRow: {
      marginVertical: 3,
      flexDirection: 'row',
    },
    messageRowRight: {
      justifyContent: 'flex-end',
    },
    messageRowLeft: {
      justifyContent: 'flex-start',
    },

    // Bubbles
    bubble: {
      maxWidth: SCREEN_WIDTH * 0.75,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 6,
      borderRadius: 18,
    },
    myBubble: {
      backgroundColor: theme.background,
      borderBottomRightRadius: 4,
    },
    theirBubble: {
      backgroundColor: theme.walletItemColor,
      borderBottomLeftRadius: 4,
    },

    // Message text
    messageText: {
      fontSize: 16,
      lineHeight: 22,
    },
    myMessageText: {
      color: '#FFFFFF',
    },
    theirMessageText: {
      color: theme.font,
    },

    // Timestamps
    timeText: {
      fontSize: 11,
      marginTop: 3,
      alignSelf: 'flex-end',
    },
    myTimeText: {
      color: 'rgba(255,255,255,0.65)',
    },
    theirTimeText: {
      color: theme.gray,
    },

    // Input area
    inputWrapper: {
      backgroundColor: theme.backgroundColor,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.whiteOutline,
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    inputPill: {
      flex: 1,
      borderRadius: 24,
      backgroundColor: theme.lightBackground,
      overflow: 'hidden',
    },
    textInput: {
      backgroundColor: 'transparent',
      maxHeight: 120,
    },
    textContent: {
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'android' ? 6 : 10,
      fontSize: 16,
    },

    // Send button
    sendButton: {
      marginLeft: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    sendButtonActive: {
      backgroundColor: theme.background,
    },
    sendButtonInactive: {
      backgroundColor: theme.disabledItem,
    },
    sendArrow: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.gray,
      lineHeight: 22,
    },
    sendArrowActive: {
      color: '#FFFFFF',
    },
  });
