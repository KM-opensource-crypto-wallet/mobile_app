import React, {useContext, useMemo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import myStyles from './MessageHeaderStyles';
import {ThemeContext} from 'theme/ThemeContext';
import Back from 'assets/images/sidebarIcons/Back.svg';
import Clipboard from '@react-native-clipboard/clipboard';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import Toast from 'react-native-toast-message';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {updateConsentState} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';
import {useDispatch} from 'react-redux';
import {getCustomizePublicAddress} from 'dok-wallet-blockchain-networks/helper';
import {useNavigation} from '@react-navigation/native';
import Animated, {
  SlideInRight,
  SlideOutRight,
  Easing,
} from 'react-native-reanimated';
import AntIcon from 'react-native-vector-icons/AntDesign';
import CopyIcon from 'assets/images/icons/copy.svg';

const MessageHeader = ({
  conversation,
  selectedMessages,
  isMultiSelectEnable,
  onPressClose,
  onPressCopy,
  onPressForward,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const hasSelectedData = useMemo(() => {
    return Object.keys(selectedMessages).length;
  }, [selectedMessages]);

  const title = useMemo(() => {
    return (
      conversation?.name || getCustomizePublicAddress(conversation?.peerAddress)
    );
  }, [conversation?.name, conversation?.peerAddress]);
  if (isMultiSelectEnable) {
    return (
      <Animated.View
        style={styles.mainView}
        entering={SlideInRight.duration(250).easing(Easing.ease)}
        exiting={SlideOutRight.duration(250).easing(Easing.ease)}>
        <TouchableOpacity
          hitSlop={{top: 8, left: 8, right: 8, bottom: 8}}
          onPress={onPressClose}>
          <AntIcon size={22} name={'close'} color={theme.borderActiveColor} />
        </TouchableOpacity>
        {!!hasSelectedData && (
          <View style={styles.rowView}>
            <TouchableOpacity
              hitSlop={{top: 8, left: 8, right: 8, bottom: 8}}
              onPress={onPressCopy}>
              <CopyIcon fill={theme.borderActiveColor} width={20} height={30} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{top: 8, left: 8, right: 8, bottom: 8}}
              onPress={onPressForward}>
              <EntypoIcon
                size={22}
                name={'forward'}
                color={theme.borderActiveColor}
              />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  }
  return (
    <View style={styles.mainView}>
      <TouchableOpacity
        hitSlop={{top: 8, left: 8, right: 8, bottom: 8}}
        onPress={() => {
          navigation.goBack();
        }}>
        <Back width="22" height="18" fill={theme.borderActiveColor} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.titleButton}
        onPress={() => {
          if (conversation?.peerAddress) {
            Clipboard.setString(conversation.peerAddress);
            triggerHapticFeedbackLight();
            Toast.show({
              type: 'successToast',
              text1: 'Address copied',
            });
          }
        }}>
        <Text style={styles.title} numberOfLines={1}>
          {title || ''}
        </Text>
      </TouchableOpacity>
      <View>
        <Menu>
          <MenuTrigger>
            <EntypoIcon
              size={24}
              name={'dots-three-vertical'}
              color={theme.font}
            />
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={styles.optionsContainer}>
            <MenuOption
              onSelect={() => {
                navigation.navigate('EditConversation');
              }}
              style={{padding: 0}}>
              <View style={styles.optionMenu}>
                <EntypoIcon
                  size={22}
                  name={'edit'}
                  color={theme.borderActiveColor}
                />
                <Text style={styles.optionText}>{'Edit'}</Text>
              </View>
            </MenuOption>
            <MenuOption
              style={{padding: 0}}
              onSelect={() => {
                dispatch(
                  updateConsentState({
                    peerAddress: conversation?.peerAddress,
                    topic: conversation?.topic,
                    address: conversation?.clientAddress,
                    consentState:
                      conversation?.consentState === 'denied'
                        ? 'allowed'
                        : 'denied',
                  }),
                );
              }}>
              <View style={styles.optionMenu}>
                <EntypoIcon
                  size={22}
                  name={'block'}
                  color={theme.borderActiveColor}
                />
                <Text style={styles.optionText}>
                  {conversation?.consentState === 'denied'
                    ? 'Unblock'
                    : 'Block'}
                </Text>
              </View>
            </MenuOption>
            <MenuOption
              style={{padding: 0}}
              onSelect={() => {
                if (conversation?.peerAddress) {
                  InAppBrowser.open(
                    `https://etherscan.io/address/${conversation?.peerAddress}`,
                    inAppBrowserOptions,
                  ).then();
                }
              }}>
              <View style={styles.optionMenu}>
                <FeatherIcon
                  size={22}
                  name={'external-link'}
                  color={theme.borderActiveColor}
                />
                <Text style={styles.optionText}>{'View in explorer'}</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    </View>
  );
};

export default MessageHeader;
