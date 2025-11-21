import React, {useContext} from 'react';
import {View, Text} from 'react-native';
import myStyles from './MessagePopoverStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import CopyIcon from 'assets/images/icons/copy.svg';

const MessagePopover = ({
  onRef,
  isLeft,
  onPressSingleCopy,
  onPressSingleForward,
  onPressSingleReply,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <Menu ref={onRef}>
      <MenuTrigger />
      <MenuOptions
        optionsContainerStyle={[
          styles.optionsContainer,
          isLeft && {marginLeft: 0},
        ]}>
        <MessageOption
          icon={
            <CopyIcon fill={theme.borderActiveColor} width={20} height={30} />
          }
          text={'Copy'}
          onSelect={onPressSingleCopy}
          styles={styles}
        />
        <MessageOption
          icon={
            <EntypoIcon
              size={22}
              name={'forward'}
              color={theme.borderActiveColor}
            />
          }
          text={'Forward'}
          onSelect={onPressSingleForward}
          styles={styles}
        />
        <MessageOption
          icon={
            <EntypoIcon
              size={22}
              name={'reply'}
              color={theme.borderActiveColor}
            />
          }
          text={'Reply'}
          onSelect={onPressSingleReply}
          styles={styles}
        />
      </MenuOptions>
    </Menu>
  );
};

const MessageOption = ({icon, text, onSelect, styles}) => (
  <MenuOption onSelect={onSelect} style={styles.menuOption}>
    <View
      style={styles.optionMenu}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Copy message"
      accessibilityHint="Copies the selected message to clipboard">
      {icon}
      <Text style={styles.optionText}>{text}</Text>
    </View>
  </MenuOption>
);

export default MessagePopover;
