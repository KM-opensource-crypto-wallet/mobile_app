// redux-persist `Storage` over the encrypted MMKV state store. The interface is
// promise-based, so readiness lives here: every call awaits bootstrapStorage()
// and then uses MMKV's synchronous JSI API (react-native-mmkv
// docs/WRAPPER_REDUX.md).
import {bootstrapStorage} from './bootstrap';

// redux-persist starts a slice from its initial state when the stored copy
// cannot be read back (unparseable JSON, a migrate or outbound-transform
// error) and then persists that empty state over the stored one. The store
// blocks writes for such a key (see store.js), so the stored data stays for a
// later launch or a fixed version instead of being overwritten.
const blockedKeys = new Set();
export const blockWrites = key => {
  blockedKeys.add(key);
};
export const isWriteBlocked = key => blockedKeys.has(key);

export const mmkvStorage = {
  getItem: async key => {
    const store = await bootstrapStorage();
    const value = store.getString(key);
    return value === undefined ? null : value;
  },
  setItem: async (key, value) => {
    if (blockedKeys.has(key)) {
      return;
    }
    const store = await bootstrapStorage();
    store.set(key, value);
  },
  removeItem: async key => {
    const store = await bootstrapStorage();
    store.remove(key);
  },
};
