import {Platform} from 'react-native';
import * as rnsi from 'react-native-sensitive-info';
import * as fingerprint from 'react-native-fingerprint-scanner';
import * as secureStore from 'security/secureStore';
import {SECURE_STORE_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';

const service = () => secureStore.SECURE_STORE_SERVICE;

describe('secureStore (react-native-sensitive-info adapter)', () => {
  beforeEach(() => {
    rnsi.__mock.reset();
    fingerprint.__mock.reset();
    Platform.OS = 'ios';
  });

  it('isBiometricAvailable follows the sensor: enrolled → true, anything else → false', async () => {
    expect(await secureStore.isBiometricAvailable()).toBe(true);
    fingerprint.__mock.state.available = false;
    expect(await secureStore.isBiometricAvailable()).toBe(false);
  });

  it('reports biometric capability', () => {
    expect(secureStore.capabilities.biometric).toBe(true);
  });

  it('set/get/has/remove round-trip under the vault service', async () => {
    await secureStore.set('k', 'v');
    // 6.x defaults accessControl to secureEnclaveBiometry: an unprotected
    // write must always say `none` explicitly.
    expect(rnsi.setItem).toHaveBeenLastCalledWith('k', 'v', {
      service: service(),
      accessControl: 'none',
    });
    expect(await secureStore.get('k')).toBe('v');
    expect(rnsi.getItem).toHaveBeenLastCalledWith('k', {service: service()});
    expect(await secureStore.has('k')).toBe(true);
    await secureStore.remove('k');
    expect(await secureStore.has('k')).toBe(false);
    expect(await secureStore.get('k')).toBeNull();
  });

  it('returns null for a missing key and tolerates removing one, on both platforms', async () => {
    for (const os of ['ios', 'android']) {
      Platform.OS = os;
      expect(await secureStore.get('missing')).toBeNull();
      await expect(secureStore.remove('missing')).resolves.toBeUndefined();
    }
  });

  it('passes the biometric policy and prompt through and counts prompts', async () => {
    const prompt = {title: 'Unlock', subtitle: 'Face ID'};
    await secureStore.set('bio', 'dek', {
      accessControl: 'biometryCurrentSet',
      authenticationPrompt: prompt,
    });
    // iOS: RNSI 6 uses `subtitle` as the LAContext fallback-button title and
    // `description` as the reason, so the copy moves to `description`.
    expect(rnsi.setItem).toHaveBeenLastCalledWith('bio', 'dek', {
      service: service(),
      accessControl: 'biometryCurrentSet',
      authenticationPrompt: {title: 'Unlock', description: 'Face ID'},
    });
    const before = rnsi.__mock.state.prompts;
    expect(
      await secureStore.get('bio', {
        accessControl: 'biometryCurrentSet',
        authenticationPrompt: prompt,
      }),
    ).toBe('dek');
    // Reads take the same `authenticationPrompt` option in 6.x; no policy
    // (the stored one governs).
    expect(rnsi.getItem).toHaveBeenLastCalledWith('bio', {
      service: service(),
      authenticationPrompt: {title: 'Unlock', description: 'Face ID'},
    });
    expect(rnsi.__mock.state.prompts).toBe(before + 1);
    // has() never prompts.
    expect(await secureStore.has('bio')).toBe(true);
    expect(rnsi.__mock.state.prompts).toBe(before + 1);
  });

  it('keeps title + subtitle on Android, where BiometricPrompt shows both', async () => {
    Platform.OS = 'android';
    const prompt = {title: 'Unlock', subtitle: 'Confirm'};
    await secureStore.set('bio', 'dek', {
      accessControl: 'biometryCurrentSet',
      authenticationPrompt: prompt,
    });
    expect(rnsi.setItem).toHaveBeenLastCalledWith('bio', 'dek', {
      service: service(),
      accessControl: 'biometryCurrentSet',
      authenticationPrompt: {title: 'Unlock', subtitle: 'Confirm'},
    });
  });

  it('refuses a protected write the platform silently downgraded', async () => {
    rnsi.__mock.state.downgradeTo = 'devicePasscode';
    await expect(
      secureStore.set('bio', 'dek', {accessControl: 'biometryCurrentSet'}),
    ).rejects.toMatchObject({
      name: 'SecureStoreError',
      code: SECURE_STORE_ERROR_CODES.UNAVAILABLE,
    });
    // Nothing may be left behind under the weaker policy.
    expect(rnsi.deleteItem).toHaveBeenCalledWith('bio', {service: service()});
    expect(await secureStore.has('bio')).toBe(false);
  });

  it('maps RNSI error codes to platform-neutral codes', async () => {
    await secureStore.set('bio', 'dek', {accessControl: 'biometryCurrentSet'});
    rnsi.__mock.invalidate('bio', {service: service()});
    await expect(
      secureStore.get('bio', {accessControl: 'biometryCurrentSet'}),
    ).rejects.toMatchObject({
      name: 'SecureStoreError',
      code: SECURE_STORE_ERROR_CODES.KEY_INVALIDATED,
    });

    rnsi.__mock.reset();
    await secureStore.set('bio', 'dek', {accessControl: 'biometryCurrentSet'});
    rnsi.__mock.state.cancelNext = true;
    await expect(
      secureStore.get('bio', {accessControl: 'biometryCurrentSet'}),
    ).rejects.toMatchObject({code: SECURE_STORE_ERROR_CODES.USER_CANCELLED});

    // Android 6.1.5 reports a Keystore key destroyed by an enrollment change
    // as a plain message, without the [E_KEY_INVALIDATED] marker.
    for (const message of [
      'Decryption key invalidated. Item must be recreated.',
      'Decryption key unavailable. Item must be recreated.',
    ]) {
      rnsi.getItem.mockRejectedValueOnce(new Error(message));
      await expect(
        secureStore.get('bio', {accessControl: 'biometryCurrentSet'}),
      ).rejects.toMatchObject({code: SECURE_STORE_ERROR_CODES.KEY_INVALIDATED});
    }
  });

  it('treats a generic failure for an absent unprotected key as null', async () => {
    rnsi.getItem.mockRejectedValueOnce(new Error('Failed to retrieve'));
    expect(await secureStore.get('nothing-here')).toBeNull();
  });

  it('does not mask a failed read of an existing unprotected key as absent', async () => {
    await secureStore.set('k', 'v');
    rnsi.getItem.mockRejectedValueOnce(new Error('Keychain fetch failed'));
    await expect(secureStore.get('k')).rejects.toMatchObject({
      code: SECURE_STORE_ERROR_CODES.UNKNOWN,
    });
  });

  it('does not mask a failed protected read as absent', async () => {
    await secureStore.set('bio', 'dek', {accessControl: 'biometryCurrentSet'});
    rnsi.getItem.mockRejectedValueOnce(new Error('Failed to retrieve'));
    await expect(
      secureStore.get('bio', {accessControl: 'biometryCurrentSet'}),
    ).rejects.toMatchObject({code: SECURE_STORE_ERROR_CODES.UNKNOWN});
  });

  it('getFromService reads another service without a policy', async () => {
    await rnsi.setItem('persist:root2', '{"legacy":true}', {
      service: 'myKeychain',
      accessControl: 'none',
    });
    expect(
      await secureStore.getFromService('persist:root2', 'myKeychain'),
    ).toBe('{"legacy":true}');
    expect(rnsi.getItem).toHaveBeenLastCalledWith('persist:root2', {
      service: 'myKeychain',
    });
    expect(await secureStore.getFromService('absent', 'myKeychain')).toBeNull();
  });
});
