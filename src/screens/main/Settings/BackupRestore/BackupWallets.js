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
import BackupRestoreUserMenu from 'components/BackupRestore/BackupRestoreUserMenu';

import {
  selectVisibleWallets,
  getMasterClientId,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';
import {
  backupWalletsToDrive,
  deleteWalletBackup,
  googleDrive,
  initGoogleDrive,
} from 'utils/googleDriveBackup';
import {showToast} from 'utils/toast';

import WalletSelectionCard from 'components/BackupRestore/WalletSelectionCard';
import ModalDeleteBackup from 'components/ModalDeleteBackup';
import myStyles from './styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const BackupWallets = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const [userInfo, setUserInfo] = useState(null);

  const allWallets = useSelector(selectVisibleWallets);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        initGoogleDrive();
        const currentUser = await googleDrive.isGoogleSignedIn();

        if (currentUser?.user) {
          setUserInfo(currentUser.user);
          return;
        }

        const hasPrevious = googleDrive.hasPreviousSignIn();

        if (hasPrevious) {
          const user = await googleDrive.signInSilently();
          const userData = user?.data?.user || user?.user || null;
          setUserInfo(userData);
        }
      } catch (err) {
        console.log('BackupWallets - Session check failed:', err);
      }
    };
    checkSession();
  }, []);

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

  const handleLogout = useCallback(async notShowToast => {
    try {
      await googleDrive.googleSignOut();
      setUserInfo(null);
      if (!notShowToast) {
        showToast({type: 'successToast', message: 'Logged out successfully'});
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  const handleDeleteBackup = useCallback(async () => {
    try {
      await deleteWalletBackup();
      showToast({
        type: 'successToast',
        title: 'Backup Deleted',
        message: 'All wallet backups have been deleted from Google Drive.',
      });
    } catch (err) {
      console.error('Delete Backup Failed:', err);
      showToast({
        type: 'errorToast',
        title: 'Delete Failed',
        message:
          err?.message === 'No backup file found to delete.'
            ? 'No backup found to delete.'
            : err?.message || 'Failed to delete backup from Google Drive.',
      });
    }
  }, []);

  useLayoutEffect(() => {
    const headerRight = () => (
      <BackupRestoreUserMenu
        userInfo={userInfo}
        onDeleteBackup={() => setShowDeleteModal(true)}
        onLogout={handleLogout}
        styles={styles}
      />
    );
    navigation.setOptions({headerRight});
  }, [navigation, userInfo, styles, handleLogout]);

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
      if (!userInfo) {
        const user = await googleDrive.googleSignIn();
        setUserInfo(user?.data?.user || user?.user || null);
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
      console.error('Backup Failed:', err);
      if (err?.message?.includes('insufficient authentication scopes')) {
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

      <ModalDeleteBackup
        visible={showDeleteModal}
        hideModal={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBackup}
      />
    </DokSafeAreaView>
  );
};

export default BackupWallets;
