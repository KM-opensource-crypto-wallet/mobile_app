import React, {
  useState,
  useCallback,
  useContext,
  useLayoutEffect,
  useEffect,
  useMemo,
} from 'react';
import {View, Text, FlatList, TouchableOpacity, Pressable} from 'react-native';
import {useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import ModalConfirm from 'components/ModalConfirm';
import DriveGuideModal from 'components/BackupRestore/DriveGuideModal';
import Checkbox from 'components/Checkbox';
import FastImage from '@d11/react-native-fast-image';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {
  selectAllWallets,
  getMasterClientId,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';
import {
  backupWalletsToDrive,
  initGoogleDrive,
  googleDrive,
} from 'utils/googleDriveBackup';
import {showToast} from 'utils/toast';

import WalletSelectionCard from 'components/BackupRestore/WalletSelectionCard';
import myStyles from './styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const BackupWallets = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);

  const allWallets = useSelector(selectAllWallets);
  const masterClientId = useSelector(getMasterClientId);
  const localCurrency = useSelector(getLocalCurrency);
  const symbol = currencySymbol[localCurrency] || '$';

  // Local state for selection
  const [selectedWalletIds, setSelectedWalletIds] = useState(
    allWallets.map(w => w.clientId),
  );

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDriveGuideModal, setShowDriveGuideModal] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Computed state for "Select All"
  const isAllSelected = useMemo(
    () =>
      allWallets.length > 0 && selectedWalletIds.length === allWallets.length,
    [allWallets, selectedWalletIds],
  );

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedWalletIds([]);
    } else {
      setSelectedWalletIds(allWallets.map(w => w.clientId));
    }
  }, [isAllSelected, allWallets]);

  useEffect(() => {
    const init = async () => {
      try {
        initGoogleDrive();
        const user = await googleDrive.googleGetUser();
        setUserInfo(user?.user || null);
      } catch (err) {}
    };
    init();
  }, []);

  const handleLogout = async () => {
    try {
      await googleDrive.googleSignOut();
      setUserInfo(null);
      showToast({type: 'successToast', message: 'Logged out successfully'});
    } catch (err) {}
  };

  useLayoutEffect(() => {
    const headerRight = () => (
      <View style={styles.headerRightContainer}>
        {userInfo ? (
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

              {/* Logout Option */}
              <MenuOption onSelect={handleLogout} style={styles.menuOption}>
                <View style={styles.menuOptionContent}>
                  <AntIcon name="logout" size={18} />
                  <Text style={styles.menuOptionText}>Logout</Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        ) : null}
      </View>
    );
    navigation.setOptions({headerRight});
  }, [navigation, userInfo, theme, styles]);

  const toggleSelect = useCallback(clientId => {
    setSelectedWalletIds(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  }, []);

  const handleBackupPress = () => {
    if (selectedWalletIds.length === 0) {
      showToast({
        type: 'errorToast',
        title: 'No Wallets Selected',
        message: 'Please select at least one wallet to backup.',
      });
      return;
    }
    setShowWarningModal(true);
  };

  const performBackup = () => {
    setShowWarningModal(false);
    setShowDriveGuideModal(true);
  };

  const handleDriveGuideContinue = async () => {
    setShowDriveGuideModal(false);
    setIsBackingUp(true);

    try {
      let currentUser = userInfo;
      if (!currentUser) {
        await googleDrive.googleSignIn();
        const userWrapper = await googleDrive.googleGetUser();
        currentUser = userWrapper?.user;
        setUserInfo(currentUser);
      }
      const selectedWallets = allWallets.filter(w =>
        selectedWalletIds.includes(w.clientId),
      );

      const formattedWallets = selectedWallets.map(w => ({
        ...w,
        coins: w.coins || [],
        clientId: w.clientId || '',
        walletName: w.walletName || '',
        phrase: w.phrase || '',
        privateKey: w?.privateKey || '',
        chain_name: w?.chain_name || w?.coins?.[0]?.chain_name || '',
      }));

      const backupData = {
        wallets: formattedWallets,
        masterClientId: masterClientId || '',
      };

      await backupWalletsToDrive(backupData);

      showToast({
        type: 'successToast',
        title: 'Backup Successful',
        message: 'Your wallets have been safely backed up to Google Drive.',
      });
    } catch (err) {
      // Handle known cancellation error for UX
      // err.code === statusCodes.SIGN_IN_CANCELLED
      console.error(err.message);
      if (err.message.includes('insufficient authentication scopes')) {
        await handleLogout();
      }
      showToast({
        type: 'errorToast',
        title: 'Backup Failed',
        message:
          !err?.message || err?.message?.includes('DEVELOPER_ERROR')
            ? 'An unexpected error occurred during backup.'
            : err?.message,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const renderItem = ({item}) => (
    <WalletSelectionCard
      item={item}
      isSelected={selectedWalletIds.includes(item.clientId)}
      toggleSelect={toggleSelect}
      currencySymbol={symbol}
    />
  );

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.screenTitle}>Backup Wallets</Text>
          <Text style={styles.subTitle}>
            Select the wallets you want to secure.
          </Text>
        </View>
      </View>

      <View style={styles.selectAllRow}>
        <Pressable onPress={toggleSelectAll} style={styles.selectAllLeft}>
          <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
          <Text style={styles.selectAllText}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </Pressable>
        <Text style={styles.selectionCount}>
          {selectedWalletIds.length}/{allWallets.length} Selected
        </Text>
      </View>

      <FlatList
        data={allWallets}
        renderItem={renderItem}
        keyExtractor={item => item.clientId || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (selectedWalletIds.length === 0 || isBackingUp) &&
              styles.buttonDisabled,
          ]}
          onPress={handleBackupPress}
          disabled={isBackingUp || selectedWalletIds.length === 0}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {isBackingUp ? 'Backing up...' : 'Backup Selected'}
          </Text>
        </TouchableOpacity>
      </View>

      <ModalConfirm
        visible={showWarningModal}
        title="Backup Warning"
        description="This is not a foolproof backup. You are responsible for keeping your recovery phrase safe. Google Drive backup is for convenience only."
        yesButtonTitle="I Understand"
        noButtonTitle="Cancel"
        onPressYes={performBackup}
        onPressNo={() => setShowWarningModal(false)}
      />

      <DriveGuideModal
        visible={showDriveGuideModal}
        onContinue={handleDriveGuideContinue}
      />
    </DokSafeAreaView>
  );
};

export default BackupWallets;
