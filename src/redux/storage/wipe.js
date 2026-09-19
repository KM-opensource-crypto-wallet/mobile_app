// "Delete all data" / wallet reset. Replaces the bare `persistor.purge()`:
// the purge only clears redux-persist's keys, it never removed the secure
// items (defect D4) and would leave an encrypted MMKV file whose key is gone.
//
// Order: purge (stop the persistoid writing) → vault → MMKV file → its key →
// legacy blob. Each step is independent so a failure in one still lets the
// rest run; errors are collected and the first is rethrown at the end.
import {deleteMMKV, existsMMKV} from 'react-native-mmkv';
import {deleteItem} from 'react-native-sensitive-info';
import * as secureStore from 'security/secureStore';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {addBreadcrumb, captureError} from 'services/logger';
import {STATE_MMKV_ID, STORAGE_KEYS, resetBootstrap} from './bootstrap';

// The pre-vault single blob written by redux-persist-sensitive-storage.
export const LEGACY_ROOT_KEY = `persist:${process.env.REDUX_KEY}`;
export const LEGACY_KEYCHAIN_SERVICE = process.env.REDUX_KEYCHAIN_NAME;

export const removeLegacyRootBlob = async () => {
  try {
    await deleteItem(LEGACY_ROOT_KEY, {
      keychainService: LEGACY_KEYCHAIN_SERVICE,
    });
  } catch (error) {
    // Missing item is the normal case after finalisation.
    if (error?.code !== 'E_NOT_FOUND') {
      throw error;
    }
  }
};

export const wipeAllLocalData = async ({persistor} = {}) => {
  const errors = [];
  const attempt = async (step, fn) => {
    try {
      await fn();
    } catch (error) {
      errors.push(error);
      captureError(error, {tags: {area: 'storage', op: 'wipe', step}});
    }
  };

  await attempt('purge', async () => {
    if (persistor) {
      await persistor.purge();
    }
  });
  await attempt('vault', () => vault.destroy());
  await attempt('mmkv', async () => {
    resetBootstrap();
    if (existsMMKV(STATE_MMKV_ID)) {
      deleteMMKV(STATE_MMKV_ID);
    }
  });
  await attempt('mmkvKey', () => secureStore.remove(STORAGE_KEYS.mmkvKey));
  await attempt('legacy', removeLegacyRootBlob);

  addBreadcrumb('storage', 'storage.wiped', {errors: errors.length}, 'info');
  if (errors.length) {
    throw errors[0];
  }
};
