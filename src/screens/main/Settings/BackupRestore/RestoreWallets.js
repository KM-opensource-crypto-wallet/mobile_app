import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useLayoutEffect,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {createWalletsBatch} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  restoreWalletsFromDrive,
  initGoogleDrive,
  googleDrive,
} from 'utils/googleDriveBackup';
import {showToast} from 'utils/toast';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
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

import WalletSelectionCard from 'components/BackupRestore/WalletSelectionCard';
import DriveGuideModal from 'components/BackupRestore/DriveGuideModal';
import myStyles from './styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const RestoreWallets = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const dispatch = useDispatch();

  const existingWallets = useSelector(selectAllWallets);

  const [restorableWallets, setRestorableWallets] = useState([]);
  const [selectedWalletIds, setSelectedWalletIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [showDriveGuideModal, setShowDriveGuideModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  const initAndCheckSession = useCallback(async () => {
    try {
      initGoogleDrive();
      const hasPrevious = GoogleSignin.hasPreviousSignIn();
      if (hasPrevious) {
        try {
          const user = await GoogleSignin.signInSilently();
          setUserInfo(user?.data?.user || null);
          fetchBackup();
        } catch (silentError) {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAndCheckSession();
  }, [initAndCheckSession]);

  const handleConnect = () => {
    setShowDriveGuideModal(true);
  };

  const handleDriveGuideContinue = async () => {
    setShowDriveGuideModal(false);
    setLoading(true);
    setError(null);
    try {
      await googleDrive.googleSignIn();
      const userWrapper = await googleDrive.googleGetUser();
      setUserInfo(userWrapper?.user);
      fetchBackup();
    } catch (err) {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleDrive.googleSignOut();
      setUserInfo(null);
      setRestorableWallets([]);
      setError(null);
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

  const handleRetry = async () => {
    await handleLogout();
    handleConnect();
  };

  const fetchBackup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await restoreWalletsFromDrive();

      if (data && data.wallets && Array.isArray(data.wallets)) {
        const wallets = data.wallets.filter(w => w.phrase || w.privateKey);
        setRestorableWallets(wallets);
        setSelectedWalletIds(wallets.map(w => w.clientId));
      } else {
        setRestorableWallets([]);
        showToast({
          type: 'warningToast',
          title: 'No Data',
          message: 'No valid wallet backup found.',
        });
      }
    } catch (err) {
      setError(err);
      showToast({
        type: 'errorToast',
        title: 'Download Failed',
        message:
          !err?.message || err?.message?.includes('DEVELOPER_ERROR')
            ? 'Failed to download backup.'
            : err?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isAllSelected =
    restorableWallets.length > 0 &&
    selectedWalletIds.length === restorableWallets.length;

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedWalletIds([]);
    } else {
      setSelectedWalletIds(restorableWallets.map(w => w.clientId));
    }
  }, [isAllSelected, restorableWallets]);

  const toggleSelect = useCallback(clientId => {
    setSelectedWalletIds(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  }, []);

  const handleRestorePress = async () => {
    if (selectedWalletIds.length === 0) return;

    setRestoring(true);
    let duplicateCount = 0;

    const walletsToRestore = [];
    const selectedWallets = restorableWallets.filter(w =>
      selectedWalletIds.includes(w.clientId),
    );

    for (const wallet of selectedWallets) {
      const isDuplicate = existingWallets.some(existing => {
        return existing.clientId === wallet.clientId;
      });

      if (isDuplicate) {
        duplicateCount++;
      } else {
        walletsToRestore.push({
          ...wallet, // Pass everything from backup
          isFromBackup: true,
        });
      }
    }

    if (walletsToRestore.length > 0) {
      try {
        const result = await dispatch(
          createWalletsBatch(walletsToRestore),
        ).unwrap();
        const successCount = result?.newWallets?.length || 0;
        const failCount = result?.failedWallets?.length || 0;

        if (successCount > 0) {
          showToast({
            type: 'successToast',
            title: 'Restore Complete',
            message: `Restored ${successCount} wallets.`,
          });
          navigation.goBack();
        } else if (failCount > 0) {
          showToast({
            type: 'errorToast',
            title: 'Restore Issues',
            message: `Failed to restore ${failCount} wallets.`,
          });
        }
      } catch (err) {
        showToast({
          type: 'errorToast',
          title: 'Restore Failed',
          message: err.message || 'Batch restore process failed.',
        });
      }
    } else if (duplicateCount > 0) {
      showToast({
        type: 'warningToast',
        title: 'No New Wallets',
        message: 'All selected wallets already exist on this device.',
      });
    }

    setRestoring(false);
  };

  const renderItem = ({item}) => {
    const isRestored = existingWallets.some(
      existing => existing.clientId === item.clientId,
    );
    return (
      <WalletSelectionCard
        item={item}
        isSelected={selectedWalletIds.includes(item.clientId)}
        toggleSelect={toggleSelect}
        isRestored={isRestored}
      />
    );
  };

  if (loading) {
    return (
      <DokSafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.font} />
        <Text style={[styles.text, styles.marginTop20]}>
          {userInfo ? 'Searching for backups...' : 'Starting...'}
        </Text>
      </DokSafeAreaView>
    );
  }

  // Not Logged In
  if (!userInfo) {
    return (
      <DokSafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.text, styles.emptyStateDescription]}>
            Connect your Google Drive to restore wallet backups.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleConnect}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>Connect Google Drive</Text>
          </TouchableOpacity>
        </View>
        <DriveGuideModal
          visible={showDriveGuideModal}
          onContinue={handleDriveGuideContinue}
        />
      </DokSafeAreaView>
    );
  }

  // Logged In but Fetch Error (Retry State)
  if (error) {
    return (
      <DokSafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.emptyStateContainer}>
          <Text
            style={[styles.text, styles.emptyStateTitle, {color: theme.red}]}>
            Failed to fetch backups.
          </Text>
          <Text style={[styles.subTitle, styles.emptyStateDescription]}>
            {error.message ||
              'Please check your internet connection and permissions.'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRetry}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </DokSafeAreaView>
    );
  }

  // Logged In, Success
  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.screenTitle}>Restore Wallets</Text>
          <Text style={styles.subTitle}>
            recover your wallets from Google Drive.
          </Text>
        </View>
      </View>
      {restorableWallets.length > 0 && (
        <View style={styles.selectAllRow}>
          <Pressable onPress={toggleSelectAll} style={styles.selectAllLeft}>
            <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
            <Text style={styles.selectAllText}>
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
          <Text style={styles.selectionCount}>
            {selectedWalletIds.length}/{restorableWallets.length} Selected
          </Text>
        </View>
      )}

      {restorableWallets.length === 0 ? (
        <View style={[styles.container, styles.center]}>
          <Text style={styles.text}>No backups found in your Drive.</Text>
        </View>
      ) : (
        <FlatList
          data={restorableWallets}
          renderItem={renderItem}
          keyExtractor={item => item.clientId || item.walletName}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (restoring ||
              selectedWalletIds.length === 0 ||
              restorableWallets.length === 0) &&
              styles.buttonDisabled,
          ]}
          onPress={handleRestorePress}
          disabled={
            restoring ||
            selectedWalletIds.length === 0 ||
            restorableWallets.length === 0
          }
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {restoring ? 'Restoring...' : 'Restore Selected'}
          </Text>
        </TouchableOpacity>
      </View>
    </DokSafeAreaView>
  );
};

export default RestoreWallets;
