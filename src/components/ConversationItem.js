import React, {memo, useCallback, useContext, useMemo} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {setSelectedConversation} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {
  getCustomizePublicAddress,
  getTimeOrDateAsPerToday,
} from 'dok-wallet-blockchain-networks/helper';
import KeyboardArrow from 'assets/images/icons/keyboard-arrow-right.svg';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import Checkbox from 'components/Checkbox';

const ConversationItem = ({
  item,
  isCheckbox,
  onPressConversation,
  selectedConversation,
}) => {
  const lastMessage = item?.lastMessage;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const title = useMemo(() => {
    return item?.name || getCustomizePublicAddress(item?.peerAddress);
  }, [item?.name, item?.peerAddress]);

  const isSelected = useMemo(
    () => !!(isCheckbox && selectedConversation[item?.topic]),
    [isCheckbox, selectedConversation, item?.topic],
  );

  const handlePress = () => {
    if (!isCheckbox) {
      dispatch(
        setSelectedConversation({
          address: item.clientAddress,
          topic: item.topic,
        }),
      );
      navigation.navigate('Message');
    } else {
      onPressConversation?.(item);
    }
  };

  const handleCheckboxChange = useCallback(
    () => () => onPressConversation?.(item),
    [onPressConversation, item],
  );

  return (
    <TouchableOpacity style={styles.itemView} onPress={handlePress}>
      {isCheckbox && (
        <Checkbox checked={isSelected} onChange={handleCheckboxChange} />
      )}
      <View style={styles.subView}>
        <View style={styles.subRowView}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.date}>
            {lastMessage?.createdAt || item?.createdAt
              ? getTimeOrDateAsPerToday(
                  lastMessage?.createdAt || item?.createdAt,
                )
              : ''}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage?.text || 'No message yet'}
        </Text>
      </View>
      {!isCheckbox && (
        <KeyboardArrow height="30" width="30" style={styles.arrow} />
      )}
    </TouchableOpacity>
  );
};
const myStyles = theme => ({
  itemView: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    width: '100%',
    paddingLeft: 20,
    paddingRight: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.gray,
    justifyContent: 'space-between',
  },
  subView: {
    flex: 1,
    paddingRight: 8,
  },
  subRowView: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: theme.font,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  message: {
    color: theme.primary,
    fontSize: 13,
    fontFamily: 'Roboto-Regular',
    marginTop: 4,
  },
  date: {
    color: theme.gray,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    fontWeight: '500',
  },
  arrow: {
    fill: theme.gray,
  },
});

export default memo(ConversationItem, (prevProps, nextProps) => {
  return (
    prevProps.item.topic === nextProps.item.topic &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item?.lastMessage?.text === nextProps.item.lastMessage?.text &&
    JSON.stringify(prevProps.selectedConversation) ===
      JSON.stringify(nextProps.selectedConversation)
  );
});
