import {Platform} from 'react-native';
import * as rnsi from 'react-native-sensitive-info';
import * as fingerprint from 'react-native-fingerprint-scanner';
import * as secureStore from 'security/secureStore';
import {SECURE_STORE_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';

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
    expect(rnsi.setItem).toHaveBeenLastCalledWith('k', 'v', {
      keychainService: secureStore.SECURE_STORE_SERVICE,
      accessControl: 'none',
    });
    expect(await secureStore.get('k')).toBe('v');
    expect(await secureStore.has('k')).toBe(true);
    await secureStore.remove('k');
    expect(await secureStore.has('k')).toBe(false);
    expect(await secureStore.get('k')).toBeNull();
  });

  it('returns null for a missing key on Android, where RNSI throws', async () => {
    Platform.OS = 'android';
    expect(await secureStore.get('missing')).toBeNull();
    await expect(secureStore.remove('missing')).resolves.toBeUndefined();
  });

  it('passes the biometric policy and prompt through and counts prompts', async () => {
    const prompt = {title: 'Unlock', subtitle: 'Face ID'};
    await secureStore.set('bio', 'dek', {
      accessControl: 'biometryCurrentSet',
      authenticationPrompt: prompt,
    });
    expect(rnsi.setItem).toHaveBeenLastCalledWith('bio', 'dek', {
      keychainService: secureStore.SECURE_STORE_SERVICE,
      accessControl: 'biometryCurrentSet',
      authenticationPrompt: prompt,
    });
    const before = rnsi.__mock.state.prompts;
    expect(
      await secureStore.get('bio', {
        accessControl: 'biometryCurrentSet',
        authenticationPrompt: prompt,
      }),
    ).toBe('dek');
    // Reads take RNSI's RetrievalOptions: `prompt`, no policy (the stored one governs).
    expect(rnsi.getItem).toHaveBeenLastCalledWith('bio', {
      keychainService: secureStore.SECURE_STORE_SERVICE,
      prompt,
    });
    expect(rnsi.__mock.state.prompts).toBe(before + 1);
    // has() never prompts.
    expect(await secureStore.has('bio')).toBe(true);
    expect(rnsi.__mock.state.prompts).toBe(before + 1);
  });

  it('maps RNSI error codes to platform-neutral codes', async () => {
    await secureStore.set('bio', 'dek', {accessControl: 'biometryCurrentSet'});
    rnsi.__mock.invalidate('bio', {
      keychainService: secureStore.SECURE_STORE_SERVICE,
    });
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

    rnsi.getItem.mockRejectedValueOnce(
      Object.assign(new Error('no keystore'), {code: 'E_KEYSTORE_UNAVAILABLE'}),
    );
    await expect(secureStore.get('x')).rejects.toMatchObject({
      code: SECURE_STORE_ERROR_CODES.UNAVAILABLE,
    });
  });

  it('treats a generic Android failure for an absent unprotected key as null', async () => {
    rnsi.getItem.mockRejectedValueOnce(new Error('Failed to retrieve'));
    expect(await secureStore.get('nothing-here')).toBeNull();
  });

  it('does not mask a failed protected read as absent', async () => {
    await secureStore.set('bio', 'dek', {accessControl: 'biometryCurrentSet'});
    rnsi.getItem.mockRejectedValueOnce(new Error('Failed to retrieve'));
    await expect(
      secureStore.get('bio', {accessControl: 'biometryCurrentSet'}),
    ).rejects.toMatchObject({code: SECURE_STORE_ERROR_CODES.UNKNOWN});
  });
});
