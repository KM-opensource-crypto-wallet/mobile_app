/* eslint-disable react/no-unstable-nested-components */
import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {View, FlatList, Text, Alert, Platform, Linking} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './NotificationAlertsStyles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import KeyboardHeightView from 'components/KeyboardHeightView';
import {useDispatch, useSelector} from 'react-redux';
import {getNotificationAlerts} from 'redux/notificationAlerts/notificationAlertsSelector';
import {Searchbar} from 'react-native-paper';
import NotificationAlertItem from 'components/NotificationAlertItem';
import ModalConfirm from 'components/ModalConfirm';
import {deleteNotificationAlert} from 'redux/notificationAlerts/notificationAlertsSlice';
import EmptyView from 'components/EmptyView';
import OneSignalManager from 'utils/oneSignalManager';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MAX_ALERTS = 20;

const NotificationAlerts = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const notificationAlerts = useSelector(getNotificationAlerts);
  const [searchText, setSearchText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const selectedItemRef = useRef(null);
  const dispatch = useDispatch();

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
        item.address?.toLowerCase()?.includes(query),
    );
  }, [searchText, notificationAlerts]);

  const checkPermissionAndNavigate = useCallback(async () => {
    if (notificationAlerts.length >= MAX_ALERTS) {
      Alert.alert(
        'Maximum Alerts Reached',
        `You can have up to ${MAX_ALERTS} notification alerts. Please delete an existing alert first.`,
      );
      return;
    }

    const hasPermission = await OneSignalManager.hasNotificationPermission();
    if (hasPermission) {
      navigation.navigate('AddNotificationAlert');
      return;
    }

    const granted = await OneSignalManager.requestNotificationPermission();
    if (granted) {
      navigation.navigate('AddNotificationAlert');
    } else {
      Alert.alert(
        'Enable Notifications',
        'Notifications must be enabled to receive transaction alerts for your wallets. Please enable them in your device settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
      );
    }
  }, [navigation, notificationAlerts.length]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRightButton}
          hitSlop={{left: 4, right: 4, top: 4, bottom: 4}}
          onPress={checkPermissionAndNavigate}>
          <Ionicons
            name={'add-circle-outline'}
            resizeMode={'contain'}
            size={24}
            color={theme.font}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme.font, checkPermissionAndNavigate, styles]);

  const keyExtractor = useCallback(item => item.id, []);

  const onPressYes = useCallback(() => {
    setShowConfirmModal(false);
    if (selectedItemRef.current) {
      dispatch(deleteNotificationAlert(selectedItemRef.current));
      OneSignalManager.removeTag(`alert_${selectedItemRef.current.id}`);
    }
  }, [dispatch]);

  const onPressNo = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const onPressDelete = useCallback(item => {
    selectedItemRef.current = item;
    setShowConfirmModal(true);
  }, []);

  const onPressEdit = useCallback(
    item => {
      navigation.navigate('AddNotificationAlert', {alert: item});
    },
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

  return (
    <View style={styles.container}>
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
      <Text style={styles.counterText}>
        {`${notificationAlerts.length}/${MAX_ALERTS} alerts`}
      </Text>
      <FlatList
        bounces={false}
        keyboardShouldPersistTaps={'always'}
        style={styles.flatlistStyle}
        contentContainerStyle={styles.contentContainerStyle}
        keyExtractor={keyExtractor}
        data={data}
        renderItem={renderItem}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListEmptyComponent={EmptyView({
          text: 'No notification alerts configured',
          buttonText: 'Add Alert',
          onPressButton: checkPermissionAndNavigate,
        })}
      />
      <KeyboardHeightView />
      <ModalConfirm
        title={`Delete alert for ${selectedItemRef?.current?.coinSymbol}?`}
        description={'This alert will be permanently removed.'}
        onPressNo={onPressNo}
        onPressYes={onPressYes}
        visible={showConfirmModal}
      />
    </View>
  );
};

export default NotificationAlerts;
