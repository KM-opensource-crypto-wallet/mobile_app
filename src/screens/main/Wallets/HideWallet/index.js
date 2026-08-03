import React, {
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Switch, TextInput} from 'react-native-paper';
import {useSelector, useDispatch, shallowEqual} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import DokRadioButton from 'components/DokRadioButton';
import ModalHideWalletConfirm from 'components/ModalHideWalletConfirm';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {
  selectAllWalletName,
  selectAllWallets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  clearWalletHideSettings,
  isSecretCodeInUseByOtherWallet,
  RELOCK_OPTIONS,
  setWalletHideSettings,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {getNotificationAlerts} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSelector';
import {
  deleteAlertsForWalletThunk,
  fetchSubscriptionsThunk,
  updateAlertThunk,
} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import {showToast} from 'utils/toast';
import {store} from 'redux/store';
import {
  generateSecretCodeSalt,
  hashSecretCode,
  isSecretCodeFormatValid,
  secretCodeMatchesWalletName,
  SECRET_CODE_ITERATIONS,
  SECRET_CODE_MAX_LENGTH,
  SECRET_CODE_MIN_LENGTH,
} from 'utils/hideWallet';
import myStyles from './HideWalletStyles';

const RELOCK_OPTIONS_UI = [
  {label: 'On app relaunch (default)', value: RELOCK_OPTIONS.RELAUNCH},
  {label: 'On app background', value: RELOCK_OPTIONS.BACKGROUND},
  {label: 'Manual only', value: RELOCK_OPTIONS.MANUAL},
];

const HideWallet = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  const walletIndex = route?.params?.walletIndex?.toString();
  const allWallets = useSelector(selectAllWallets);
  const allWalletName = useSelector(selectAllWalletName, shallowEqual);
  const notificationAlerts = useSelector(getNotificationAlerts);
  const editingWallet = allWallets[walletIndex];
  const initialHideSettings = editingWallet?.hideSettings || null;
  const otherWalletNames = useMemo(
    () => allWalletName.filter(name => name !== editingWallet?.walletName),
    [allWalletName, editingWallet?.walletName],
  );

  const [isHideEnabled, setIsHideEnabled] = useState(!!initialHideSettings);
  const [secretCode, setSecretCode] = useState('');
  const [secretCodeError, setSecretCodeError] = useState(null);
  const [hideToggleError, setHideToggleError] = useState(null);
  const [relockOption, setRelockOption] = useState(
    initialHideSettings?.relockOption || RELOCK_OPTIONS.RELAUNCH,
  );
  const [hideNotification, setHideNotification] = useState(
    initialHideSettings?.hideNotification ?? true,
  );
  // null | 'info' | 'confirm' - a single source of truth so the info and
  // confirm modals can never both be considered visible at once.
  const [hideModal, setHideModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // AC6: at least one wallet must stay PUBLIC (no hideSettings at all). A
  // merely *revealed* hidden wallet doesn't count - it re-locks on relaunch/
  // background, which would leave zero visible wallets. Disable the toggle
  // outright instead of letting the user tap it and then blocking.
  const hasOtherPublicWallet = allWallets.some(
    (item, index) =>
      index !== Number(walletIndex) &&
      !!item?.walletName &&
      !item?.hideSettings,
  );
  const isHideToggleDisabled = !isHideEnabled && !hasOtherPublicWallet;
  const isSecretCodeRequired = isHideEnabled && !initialHideSettings;
  const isHideSectionInvalid =
    isHideEnabled &&
    ((!secretCode && isSecretCodeRequired) ||
      (!!secretCode && !isSecretCodeFormatValid(secretCode)) ||
      !!secretCodeError);
  const selectedRelockLabel = RELOCK_OPTIONS_UI.find(
    option => option.value === relockOption,
  )?.label;

  // Debounced since PBKDF2 is deliberately slow - runs against every other
  // hidden wallet's stored salt/hash (AC2's "code already in use" rule).
  // Uses a manually-managed timeout (rather than the generic debounce
  // helper) so handleSecretCodeChange can cancel a pending check outright -
  // otherwise a stale timeout could fire after the input moved on (or the
  // format became invalid) and clobber a newer/correct secretCodeError.
  const duplicateCheckTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(duplicateCheckTimeoutRef.current);
    };
  }, []);

  // Sync this wallet's subscriptions from the backend so the alert count
  // shown in the modals (and the "is there anything to delete?" check in
  // syncAlertsHideNotification) reflects reality, not just what happens to
  // be in local state. Fire-and-forget: on failure we fall back to local.
  useEffect(() => {
    dispatch(fetchSubscriptionsThunk());
  }, [dispatch]);

  const walletAlerts = useMemo(
    () =>
      notificationAlerts.filter(
        alert =>
          alert.walletClientId === editingWallet?.clientId ||
          alert.walletId === editingWallet?.clientId,
      ),
    [notificationAlerts, editingWallet?.clientId],
  );

  const checkDuplicateSecretCode = useCallback(
    code => {
      duplicateCheckTimeoutRef.current = setTimeout(async () => {
        const inUse = await isSecretCodeInUseByOtherWallet(
          store.getState(),
          code,
          walletIndex,
        );
        setSecretCodeError(
          inUse ? 'This code is already used by another hidden wallet' : null,
        );
      }, 300);
    },
    [walletIndex],
  );

  const handleSecretCodeChange = text => {
    clearTimeout(duplicateCheckTimeoutRef.current);
    setSecretCode(text);
    if (!text) {
      setSecretCodeError(null);
      return;
    }
    if (!isSecretCodeFormatValid(text)) {
      setSecretCodeError(
        `Must be ${SECRET_CODE_MIN_LENGTH}-${SECRET_CODE_MAX_LENGTH} characters: letters, numbers, @, _ or - only`,
      );
      return;
    }
    if (secretCodeMatchesWalletName(text, otherWalletNames)) {
      setSecretCodeError('Secret code must not be another wallet name');
      return;
    }
    setSecretCodeError(null);
    checkDuplicateSecretCode(text);
  };

  const handleToggleHide = value => {
    // The switch is already `disabled` in this case (see isHideToggleDisabled)
    // - this is just a defensive fallback against it firing anyway.
    if (value && !hasOtherPublicWallet) {
      setHideToggleError(
        'At least one wallet must stay public. Unhide another wallet or add a new one before hiding this one.',
      );
      return;
    }
    setHideToggleError(null);
    setIsHideEnabled(value);
    if (!value) {
      setSecretCode('');
      setSecretCodeError(null);
    }
  };

  const handleRelockChange = label => {
    const found = RELOCK_OPTIONS_UI.find(option => option.label === label);
    if (found) {
      setRelockOption(found.value);
    }
  };

  // The backend doesn't reliably honor a stored hideNotification flag, so
  // suppression is enforced by deleting the subscription outright instead -
  // there's then nothing left server-side that could ever push a
  // notification. Turning the toggle back off does NOT recreate the
  // alert - the user has to re-add it via the Alert flow if they want
  // notifications for this wallet again.
  const syncAlertsHideNotification = useCallback(
    async value => {
      if (value) {
        // Single bulk call removes every subscription for this wallet on
        // the backend and purges the wallet's alerts from local state.
        // Subscriptions were synced from the backend on mount, so an empty
        // local list means there is genuinely nothing to delete - skip the
        // API call entirely.
        if (!editingWallet?.clientId || walletAlerts.length === 0) {
          return {value, totalCount: 0, failedCount: 0};
        }
        try {
          const result = await dispatch(
            deleteAlertsForWalletThunk({
              walletClientId: editingWallet.clientId,
            }),
          ).unwrap();
          return {
            value,
            totalCount: result?.deletedCount ?? walletAlerts.length,
            failedCount: 0,
          };
        } catch (e) {
          return {
            value,
            totalCount: walletAlerts.length,
            failedCount: walletAlerts.length || 1,
          };
        }
      }
      const results = await Promise.allSettled(
        walletAlerts.map(alert =>
          dispatch(
            updateAlertThunk({
              payload: {...alert, hideNotification: value},
            }),
          ).unwrap(),
        ),
      );
      return {
        value,
        totalCount: walletAlerts.length,
        failedCount: results.filter(r => r.status === 'rejected').length,
      };
    },
    [walletAlerts, editingWallet?.clientId, dispatch],
  );

  const doHideSave = useCallback(async () => {
    let syncResult = null;
    if (isHideEnabled) {
      if (secretCode) {
        // Code was already validated (name-inclusion + not-in-use-by-
        // another-wallet) in handleSubmit, before the confirm modal
        // ever opened - nothing async happens between then and here.
        const salt = generateSecretCodeSalt();
        const hash = await hashSecretCode(secretCode, salt);
        dispatch(
          setWalletHideSettings({
            walletIndex,
            secretCodeSalt: salt,
            secretCodeHash: hash,
            secretCodeIterations: SECRET_CODE_ITERATIONS,
            relockOption,
            hideNotification,
          }),
        );
        syncResult = await syncAlertsHideNotification(hideNotification);
      } else if (initialHideSettings) {
        // Blank code while already hidden = keep the existing code,
        // only the re-lock option/hideNotification may have changed.
        dispatch(
          setWalletHideSettings({
            walletIndex,
            secretCodeSalt: initialHideSettings.secretCodeSalt,
            secretCodeHash: initialHideSettings.secretCodeHash,
            secretCodeIterations: initialHideSettings.secretCodeIterations,
            relockOption,
            hideNotification,
          }),
        );
        syncResult = await syncAlertsHideNotification(hideNotification);
      }
    } else if (initialHideSettings) {
      dispatch(clearWalletHideSettings({walletIndex}));
      // Wallet is no longer hidden - its alerts should behave normally
      // again rather than staying suppressed on the backend forever.
      syncResult = await syncAlertsHideNotification(false);
    }
    if (syncResult) {
      const {value, totalCount, failedCount} = syncResult;
      const s = n => (n > 1 ? 's' : '');
      if (failedCount > 0) {
        showToast({
          type: 'errorToast',
          title: `${failedCount} alert${s(failedCount)} not synced`,
          message:
            'Some alerts could not be updated on the server. Please check your connection and try again.',
        });
      } else if (totalCount > 0) {
        showToast({
          type: 'successToast',
          title: `${totalCount} alert${s(totalCount)} synced`,
          message: value
            ? 'Removed since this wallet has notifications hidden.'
            : 'Updated for this wallet.',
        });
      }
      // totalCount === 0: no alerts exist for this wallet - nothing to sync.
    }
    if (isHideEnabled) {
      // The wallet is now hidden (setWalletHideSettings always re-locks it),
      // so screens below on the stack - the wallet list, or Home if this was
      // the current wallet - may still be showing it. Land on Home instead
      // of going back.
      navigation.reset({
        index: 0,
        routes: [{name: 'Sidebar'}],
      });
    } else {
      navigation.goBack();
    }
  }, [
    isHideEnabled,
    secretCode,
    relockOption,
    hideNotification,
    initialHideSettings,
    walletIndex,
    dispatch,
    navigation,
    syncAlertsHideNotification,
  ]);

  const performHideSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await doHideSave();
    } finally {
      setIsSaving(false);
    }
  }, [doHideSave]);

  const handleSubmit = useCallback(async () => {
    if (isHideEnabled) {
      if (secretCode) {
        if (secretCodeMatchesWalletName(secretCode, otherWalletNames)) {
          setSecretCodeError('Secret code must not be another wallet name');
          return;
        }
        setIsSaving(true);
        let codeInUse;
        try {
          codeInUse = await isSecretCodeInUseByOtherWallet(
            store.getState(),
            secretCode,
            walletIndex,
          );
        } finally {
          setIsSaving(false);
        }
        if (codeInUse) {
          setSecretCodeError(
            'This code is already used by another hidden wallet',
          );
          return;
        }
      }
      Keyboard.dismiss();
      setHideModal('confirm');
      return;
    }
    performHideSave();
  }, [
    isHideEnabled,
    secretCode,
    otherWalletNames,
    walletIndex,
    performHideSave,
  ]);

  const onConfirmHideAndSave = useCallback(() => {
    setHideModal(null);
    performHideSave();
  }, [performHideSave]);

  const onCancelHideModal = useCallback(() => {
    setHideModal(null);
  }, []);

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={80}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.hideWalletHeaderRow}>
              <Text style={styles.hideWalletLabel}>Hide wallet</Text>
              <TouchableOpacity
                style={styles.infoButton}
                hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
                onPress={() => setHideModal('info')}>
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={20}
                  color={theme.font}
                />
              </TouchableOpacity>
              <View style={{flex: 1}} />
              <Switch
                trackColor={{false: 'gray', true: '#0ecd1764'}}
                onValueChange={handleToggleHide}
                value={isHideEnabled}
                disabled={isHideToggleDisabled}
              />
            </View>

            {(hideToggleError || isHideToggleDisabled) && (
              <Text style={styles.hideToggleError}>
                {hideToggleError ||
                  'At least one wallet must stay public. Unhide another wallet or add a new one before hiding this one.'}
              </Text>
            )}

            {isHideEnabled && (
              <>
                <TextInput
                  style={styles.input}
                  label="Secret code"
                  textColor={theme.font}
                  outlineColor={secretCodeError ? 'red' : theme.gray}
                  activeOutlineColor={
                    secretCodeError ? 'red' : theme.borderActiveColor
                  }
                  autoCapitalize="none"
                  mode="outlined"
                  value={secretCode}
                  onChangeText={handleSecretCodeChange}
                  placeholder={
                    initialHideSettings
                      ? 'Leave blank to keep current code'
                      : ''
                  }
                />
                {secretCodeError && (
                  <Text style={styles.textConfirm}>{secretCodeError}</Text>
                )}

                <DokRadioButton
                  title="Re-hide this wallet:"
                  options={RELOCK_OPTIONS_UI}
                  checked={selectedRelockLabel}
                  setChecked={handleRelockChange}
                />

                <View style={styles.hideWalletHeaderRow}>
                  <Text style={styles.hideWalletLabel}>
                    Delete notifications
                  </Text>
                  <TouchableOpacity
                    style={styles.infoButton}
                    hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
                    onPress={() => setHideModal('notificationInfo')}>
                    <MaterialCommunityIcons
                      name="help-circle-outline"
                      size={20}
                      color={theme.font}
                    />
                  </TouchableOpacity>
                  <View style={{flex: 1}} />
                  <Switch
                    trackColor={{false: 'gray', true: '#0ecd1764'}}
                    onValueChange={setHideNotification}
                    value={hideNotification}
                  />
                </View>
              </>
            )}
          </ScrollView>
          <TouchableOpacity
            disabled={isHideSectionInvalid || isSaving}
            style={{
              ...styles.button,
              opacity: isHideSectionInvalid ? 0.5 : 1,
            }}
            onPress={handleSubmit}>
            {isSaving ? (
              <ActivityIndicator color={theme.title} />
            ) : (
              <Text style={styles.buttonTitle}>Save</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <ModalHideWalletConfirm
        visible={!!hideModal}
        mode={hideModal || 'confirm'}
        relockOption={relockOption}
        hideNotification={hideNotification}
        alertsCount={walletAlerts.length}
        onCancel={onCancelHideModal}
        onConfirm={onConfirmHideAndSave}
      />
    </DokSafeAreaView>
  );
};

export default HideWallet;
