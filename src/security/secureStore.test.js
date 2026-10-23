import {Platform} from 'react-native';
import * as rnsi from 'react-native-sensitive-info';
import * as fingerprint from 'react-native-fingerprint-scanner';
import * as secureStore from 'security/secureStore';
import {SECURE_STORE_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';
import {clearKeychainIntegrityTag} from 'myWallet/wallet.service';
import {logger} from 'services/logger';

jest.mock('services/logger', () => ({
  addBreadcrumb: jest.fn(),
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
// The iOS native repair: drops RNSI's stale metadata HMAC tag in place.
jest.mock('myWallet/wallet.service', () => ({
  clearKeychainIntegrityTag: jest.fn(async (service, key) => {
    const {__mock} = jest.requireMock('react-native-sensitive-info');
    return __mock.clearIntegrityTag(key, {service});
  }),
}));

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

  // iOS: RNSI's metadata HMAC key is `ThisDeviceOnly`, our unprotected items
  // are not. After Quick Start / an encrypted computer backup every moved
  // item fails the check (DOKWALLET-K) although its value is intact. The
  // repair drops the stale tag in place; the item is never rewritten.
  describe('item moved to a new device (E_INTEGRITY_VIOLATION)', () => {
    const moved = (key, options = {service: service()}) =>
      rnsi.__mock.tamper(key, options);

    beforeEach(() => {
      clearKeychainIntegrityTag.mockClear();
      logger.warn.mockClear();
      logger.error.mockClear();
    });

    it('repairs the item in place on iOS and returns its value', async () => {
      await secureStore.set('vault.dek.password', '{"v":1}');
      moved('vault.dek.password');
      rnsi.setItem.mockClear();

      expect(await secureStore.get('vault.dek.password')).toBe('{"v":1}');
      expect(clearKeychainIntegrityTag).toHaveBeenCalledWith(
        service(),
        'vault.dek.password',
      );
      // Never rewritten: no delete + add window for the wallet key.
      expect(rnsi.setItem).not.toHaveBeenCalled();
      expect(rnsi.deleteItem).not.toHaveBeenCalled();

      // Repaired: the next read succeeds without another repair.
      clearKeychainIntegrityTag.mockClear();
      expect(await secureStore.get('vault.dek.password')).toBe('{"v":1}');
      expect(clearKeychainIntegrityTag).not.toHaveBeenCalled();
    });

    it('logs the repair with key names Sentry does not filter out', async () => {
      await secureStore.set('vault.dek.password', '{"v":1}');
      moved('vault.dek.password');
      await secureStore.get('vault.dek.password');
      expect(logger.warn).toHaveBeenCalledWith('storage.integrity_repaired', {
        service: service(),
        key: 'vault.dek.<sens>',
        result: 'cleared',
      });
    });

    it('fails with integrity_violation and logs the native reason when the repair fails', async () => {
      await secureStore.set('storage.mmkvKey', 'k'.repeat(32));
      moved('storage.mmkvKey');
      clearKeychainIntegrityTag.mockRejectedValueOnce(
        Object.assign(new Error('Keychain update failed: OSStatus -25300'), {
          code: 'E_KEYCHAIN_UPDATE',
        }),
      );
      await expect(secureStore.get('storage.mmkvKey')).rejects.toMatchObject({
        name: 'SecureStoreError',
        code: SECURE_STORE_ERROR_CODES.INTEGRITY_VIOLATION,
      });
      expect(logger.error).toHaveBeenCalledWith(
        'storage.integrity_repair_failed',
        expect.objectContaining({
          key: 'storage.mmkvKey',
          code: 'E_KEYCHAIN_UPDATE',
          message: 'Keychain update failed: OSStatus -25300',
        }),
      );
      // The value is still there for the next attempt.
      expect(rnsi.__mock.items.get(`${service()}::storage.mmkvKey`)).toEqual(
        expect.objectContaining({value: 'k'.repeat(32)}),
      );
    });

    it('leaves an item stored behind biometrics alone, even on an unprotected read', async () => {
      // The simulator does not enforce Keychain access control, so the
      // stored policy, not the caller's options, decides.
      await secureStore.set('bio', 'dek', {
        accessControl: 'biometryCurrentSet',
      });
      moved('bio');
      rnsi.setItem.mockClear();
      await expect(secureStore.get('bio')).rejects.toMatchObject({
        code: SECURE_STORE_ERROR_CODES.INTEGRITY_VIOLATION,
      });
      expect(logger.error).toHaveBeenCalledWith(
        'storage.integrity_repair_failed',
        expect.objectContaining({key: 'bio', result: 'protected'}),
      );
      expect(rnsi.setItem).not.toHaveBeenCalled();
      expect(rnsi.__mock.items.get(`${service()}::bio`).accessControl).toBe(
        'biometryCurrentSet',
      );
    });

    it('never attempts a repair on a protected read', async () => {
      await secureStore.set('bio', 'dek', {
        accessControl: 'biometryCurrentSet',
      });
      moved('bio');
      await expect(
        secureStore.get('bio', {accessControl: 'biometryCurrentSet'}),
      ).rejects.toMatchObject({
        code: SECURE_STORE_ERROR_CODES.INTEGRITY_VIOLATION,
      });
      expect(clearKeychainIntegrityTag).not.toHaveBeenCalled();
    });

    it('does not attempt the iOS repair on Android', async () => {
      Platform.OS = 'android';
      await secureStore.set('k', 'v');
      moved('k');
      await expect(secureStore.get('k')).rejects.toMatchObject({
        code: SECURE_STORE_ERROR_CODES.INTEGRITY_VIOLATION,
      });
      expect(clearKeychainIntegrityTag).not.toHaveBeenCalled();
    });

    it('two overlapping reads of a moved item both get its value', async () => {
      await secureStore.set('vault.dek.password', '{"v":1}');
      moved('vault.dek.password');
      const [a, b] = await Promise.all([
        secureStore.get('vault.dek.password'),
        secureStore.get('vault.dek.password'),
      ]);
      expect(a).toBe('{"v":1}');
      expect(b).toBe('{"v":1}');
    });

    it('getFromService repairs the legacy blob without writing it back', async () => {
      await rnsi.setItem('persist:root2', '{"legacy":true}', {
        service: 'myKeychain',
        accessControl: 'none',
      });
      moved('persist:root2', {service: 'myKeychain'});
      rnsi.setItem.mockClear();
      expect(
        await secureStore.getFromService('persist:root2', 'myKeychain'),
      ).toBe('{"legacy":true}');
      expect(clearKeychainIntegrityTag).toHaveBeenCalledWith(
        'myKeychain',
        'persist:root2',
      );
      expect(rnsi.setItem).not.toHaveBeenCalled();
    });
  });
});
