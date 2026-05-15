/* eslint-disable react/no-unstable-nested-components */
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Platform,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './NotificationAlertsStyles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import KeyboardHeightView from 'components/KeyboardHeightView';
import {useDispatch, useSelector} from 'react-redux';
import {getNotificationAlerts} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSelector';
import {Searchbar} from 'react-native-paper';
import NotificationAlertItem from 'components/NotificationAlertItem';
import ModalConfirm from 'components/ModalConfirm';
import {
  deleteAlertThunk,
  fetchSubscriptionsThunk,
} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import {useFocusEffect} from '@react-navigation/native';
import EmptyView from 'components/EmptyView';
import {OneSignal} from 'react-native-onesignal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {showToast} from 'utils/toast';
import {initOneSignal} from 'utils/common';

const MAX_ALERTS = 20;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

const NotificationAlerts = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const notificationAlerts = useSelector(getNotificationAlerts);
  const [searchText, setSearchText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] =
    useState(true);
  const [dismissedAlertId, setDismissedAlertId] = useState(null);
  const selectedItemRef = useRef(null);
  const dispatch = useDispatch();

  const latestCreatedAlert = useMemo(
    () =>
      notificationAlerts
        .filter(a => a.createdAt)
        .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null,
    [notificationAlerts],
  );

  const showBanner =
    !!latestCreatedAlert && latestCreatedAlert.id !== dismissedAlertId;

  useEffect(() => {
    if (!showBanner || !latestCreatedAlert?.createdAt) {
      return;
    }
    const remaining =
      latestCreatedAlert.createdAt + FIFTEEN_MIN_MS - Date.now();
    if (remaining <= 0) {
      setDismissedAlertId(latestCreatedAlert.id);
      return;
    }
    const timer = setTimeout(
      () => setDismissedAlertId(latestCreatedAlert.id),
      remaining,
    );
    return () => clearTimeout(timer);
  }, [latestCreatedAlert?.id, latestCreatedAlert?.createdAt, showBanner]);

  const fetchAlerts = useCallback(
    async ({refreshing = false} = {}) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      const action = await dispatch(fetchSubscriptionsThunk());
      if (fetchSubscriptionsThunk.rejected.match(action)) {
        showToast({
          type: 'errorToast',
          title: 'Failed to fetch alerts',
          message: action.payload || 'Something went wrong. Please try again.',
        });
      }
      refreshing ? setIsRefreshing(false) : setIsLoading(false);
    },
    [dispatch],
  );

  const checkNotificationPermission = useCallback(async () => {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    setHasNotificationPermission(hasPermission);
  }, []);

  const handleAppStateChange = useCallback(
    appState => {
      if (appState === 'active') {
        checkNotificationPermission();
      }
    },
    [checkNotificationPermission],
  );

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      appStateSubscription.remove();
    };
  }, [handleAppStateChange]);

  useEffect(() => {
    checkNotificationPermission();
  }, [checkNotificationPermission]);

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [fetchAlerts]),
  );

  const data = useMemo(() => {
    if (!searchText) {
      return notificationAlerts;
    }
    const query = searchText.toLowerCase();
    return notificationAlerts.filter(
      item =>
        item.coinSymbol?.toLowerCase()?.includes(query) ||
        item.coinName?.toLowerCase()?.includes(query) ||
        item.walletName?.toLowerCase()?.includes(query) ||
        item.wallet?.toLowerCase()?.includes(query),
    );
  }, [searchText, notificationAlerts]);

  const checkPermissionAndNavigate = useCallback(async () => {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    if (hasPermission) {
      navigation.navigate('AddNotificationAlert');
      return;
    }
    const granted = await OneSignal.Notifications.requestPermission(false);
    if (granted) {
      await initOneSignal();
      navigation.navigate('AddNotificationAlert');
    } else {
      Alert.alert(
        'Enable Notifications',
        'Notifications must be enabled to receive transaction alerts for your wallets. Please enable them in your device settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open Settings',
            onPress: () =>
              Platform.OS === 'ios'
                ? Linking.openURL('app-settings:')
                : Linking.openSettings(),
          },
        ],
      );
    }
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRightButton}
          hitSlop={{left: 4, right: 4, top: 4, bottom: 4}}
          onPress={checkPermissionAndNavigate}>
          <Ionicons name={'add-circle-outline'} size={24} color={theme.font} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme.font, checkPermissionAndNavigate, styles]);

  const keyExtractor = useCallback(item => item.id, []);

  const onPressYes = useCallback(() => {
    setShowConfirmModal(false);
    const item = selectedItemRef.current;
    if (!item) {
      return;
    }
    dispatch(deleteAlertThunk({item})).then(action => {
      if (deleteAlertThunk.fulfilled.match(action)) {
        showToast({
          type: 'successToast',
          title: 'Alert deleted',
          message: `${item.coinSymbol} alert has been removed.`,
        });
      } else {
        showToast({
          type: 'errorToast',
          title: 'Failed to delete alert',
          message: 'Please check your connection and try again.',
        });
      }
    });
  }, [dispatch]);

  const onPressNo = useCallback(() => setShowConfirmModal(false), []);

  const onPressDelete = useCallback(item => {
    selectedItemRef.current = item;
    setShowConfirmModal(true);
  }, []);

  const onPressEdit = useCallback(
    item => navigation.navigate('AddNotificationAlertConfig', {alert: item}),
    [navigation],
  );

  const renderItem = useCallback(
    ({item}) => (
      <NotificationAlertItem
        item={item}
        onPressDelete={onPressDelete}
        onPressEdit={onPressEdit}
      />
    ),
    [onPressDelete, onPressEdit],
  );

  const openSettings = useCallback(() => {
    Platform.OS === 'ios'
      ? Linking.openURL('app-settings:')
      : Linking.openSettings();
  }, []);

  const renderPermissionMessage = useCallback(
    () => (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="notifications-off-circle"
              size={80}
              color={theme.background}
            />
          </View>
          <Text style={styles.permissionTitle}>Notifications Disabled</Text>
          <Text style={styles.permissionDescription}>
            You've turned off notification permissions. Enable them to receive
            important alerts about your transactions and wallet activities.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.75}
            onPress={openSettings}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [styles, theme.background, openSettings],
  );

  return (
    <View style={styles.container}>
      {hasNotificationPermission && (
        <View style={styles.headerContainer}>
          <Searchbar
            placeholder="Search alerts"
            value={searchText}
            style={styles.input}
            onChangeText={setSearchText}
            autoFocus={false}
            inputStyle={styles.searchInputMinHeight}
          />
        </View>
      )}
      {!hasNotificationPermission ? (
        renderPermissionMessage()
      ) : (
        <>
          {showBanner && (
            <View style={styles.bannerContainer}>
              <Ionicons
                name="time-outline"
                size={18}
                color={theme.background}
              />
              <Text style={styles.bannerText}>
                Your new alert may take up to 15 minutes to activate.
              </Text>
              <TouchableOpacity
                hitSlop={{left: 8, right: 8, top: 8, bottom: 8}}
                onPress={() => setDismissedAlertId(latestCreatedAlert.id)}>
                <Ionicons name="close" size={18} color={theme.gray} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.counterText}>
            {notificationAlerts.length}/{MAX_ALERTS} alerts
          </Text>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={styles.loader}
            />
          ) : (
            <FlatList
              keyboardShouldPersistTaps={'always'}
              style={styles.flatlistStyle}
              contentContainerStyle={styles.contentContainerStyle}
              keyExtractor={keyExtractor}
              data={data}
              renderItem={renderItem}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => fetchAlerts({refreshing: true})}
                  tintColor={theme.primary}
                />
              }
              ListEmptyComponent={EmptyView({
                text: 'No notification alerts configured',
                buttonText: 'Add Alert',
                onPressButton: checkPermissionAndNavigate,
              })}
            />
          )}
        </>
      )}
      <KeyboardHeightView />
      <ModalConfirm
        title={`Delete alert for ${selectedItemRef.current?.coinSymbol}?`}
        description={'This alert will be permanently removed.'}
        onPressNo={onPressNo}
        onPressYes={onPressYes}
        visible={showConfirmModal}
      />
    </View>
  );
};

export default NotificationAlerts;
