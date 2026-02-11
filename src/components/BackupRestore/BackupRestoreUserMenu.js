import React, {useContext} from 'react';
import {View, Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import FastImage from '@d11/react-native-fast-image';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const BackupRestoreUserMenu = ({
  userInfo,
  onDeleteBackup,
  onLogout,
  styles,
}) => {
  const {theme} = useContext(ThemeContext);

  if (!userInfo) {
    return null;
  }

  return (
    <View style={styles.headerRightContainer}>
      <Menu>
        <MenuTrigger customStyles={{triggerWrapper: {padding: 5}}}>
          <View style={styles.headerAvatarContainer}>
            <FontAwesome name="user-circle" size={26} color={theme.font} />
          </View>
        </MenuTrigger>
        <MenuOptions optionsContainerStyle={styles.menuOptionsContainer}>
          {/* User Info Section */}
          <View style={styles.userInfoSection}>
            <FastImage
              source={{uri: userInfo?.photo}}
              style={styles.userAvatar}
              resizeMode="cover"
            />
            <View style={styles.userInfoDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {userInfo?.name}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {userInfo?.email}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Delete Backup Option */}
          <MenuOption onSelect={onDeleteBackup} style={styles.menuOption}>
            <View style={styles.menuOptionContent}>
              <AntIcon name="delete" size={18} color="#ff4444" />
              <Text style={[styles.menuOptionText, {color: '#ff4444'}]}>
                Delete Backup
              </Text>
            </View>
          </MenuOption>

          <View style={styles.divider} />

          {/* Logout Option */}
          <MenuOption onSelect={onLogout} style={styles.menuOption}>
            <View style={styles.menuOptionContent}>
              <AntIcon name="logout" size={18} color={theme.font} />
              <Text style={styles.menuOptionText}>Logout</Text>
            </View>
          </MenuOption>
        </MenuOptions>
      </Menu>
    </View>
  );
};

export default BackupRestoreUserMenu;
