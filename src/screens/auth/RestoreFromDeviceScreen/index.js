import React, {useContext, useState} from 'react';
import {Keyboard, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {TextInput} from 'react-native-paper';
import {useDispatch} from 'react-redux';
import {
  fingerprintAuthSuccess,
  loadingOff,
  loadingOn,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {isInvalidPassword} from 'security/unlockFlow';
import {RESTORE_ERROR_CODES, restoreFromVault} from 'security/vaultRecovery';
import {showToast} from 'utils/toast';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import myStyles from 'screens/auth/RegistrationScreen/RegistrationScreenStyles';

// Onboarding found a vault without an account: the wallets' keys are still on
// this device. The old password rebuilds the wallets (security/vaultRecovery).
export const RestoreFromDeviceScreen = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const [password, setPassword] = useState('');
  const [hide, setHide] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleRestore = async () => {
    if (!password || busy) {
      return;
    }
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    dispatch(loadingOn());
    try {
      const {wallets, skipped} = await dispatch(restoreFromVault(password));
      dispatch(fingerprintAuthSuccess(true));
      showToast({
        type: 'successToast',
        title: 'Wallets restored',
        message: skipped
          ? `Restored ${wallets} wallets. ${skipped} had no keys to restore.`
          : `Restored ${wallets} wallets. Add any other coins you used from Manage coins.`,
      });
      navigation.reset({index: 0, routes: [{name: 'Sidebar'}]});
    } catch (e) {
      if (isInvalidPassword(e)) {
        setError('Wrong password. Use the password you had before.');
      } else if (
        e?.code === RESTORE_ERROR_CODES.NOTHING_TO_RESTORE ||
        e?.code === RESTORE_ERROR_CODES.TOO_MANY_ATTEMPTS
      ) {
        setError(e.message);
      } else {
        setError(
          e?.code === RESTORE_ERROR_CODES.FAILED
            ? e.message
            : 'Your wallets could not be restored. Nothing was changed; please try again.',
        );
      }
    } finally {
      setBusy(false);
      dispatch(loadingOff());
    }
  };

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <View style={styles.formInput}>
          <Text style={styles.title}>Restore wallets</Text>
          <Text style={styles.text}>
            Your wallets are still saved on this device. Enter the password you
            used before to restore them.
          </Text>
          <TextInput
            style={styles.input}
            textColor={theme.font}
            label="Previous password"
            theme={{
              colors: {
                onSurfaceVariant: '#989898',
                primary: error ? 'red' : '#989898',
              },
            }}
            outlineColor={error ? 'red' : '#989898'}
            activeOutlineColor={error ? 'red' : theme.borderActiveColor}
            autoCapitalize="none"
            mode="outlined"
            secureTextEntry={hide}
            right={
              <TextInput.Icon
                icon={hide ? 'eye' : 'eye-off'}
                onPress={() => setHide(!hide)}
              />
            }
            autoFocus={true}
            onChangeText={setPassword}
            onSubmitEditing={handleRestore}
            value={password}
          />
          {error && <Text style={styles.textConfirm}>{error}</Text>}
          <TouchableOpacity
            style={styles.button}
            onPress={handleRestore}
            disabled={busy}>
            <Text style={styles.buttonTitle}>
              {busy ? 'Restoring…' : 'Restore'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Registration')}
            disabled={busy}
            hitSlop={{top: 12, left: 12, right: 12, bottom: 12}}>
            <Text style={[styles.text, localStyles.link]}>
              Start over with a new account instead
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </DokSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  link: {marginTop: 20, textAlign: 'center'},
});
