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
// The newest value refused per blocked key: a restore that rebuilds the slice
// (vaultRecovery) releases the block and this value replaces the stored one.
// A refused write rejects, so it is never reported as written.
const blockedKeys = new Map();
export const blockWrites = key => {
  if (!blockedKeys.has(key)) {
    blockedKeys.set(key, undefined);
  }
};
export const isWriteBlocked = key => blockedKeys.has(key);

/** Lifts the block on `key` and writes the newest value refused meanwhile. */
export const releaseBlockedWrites = async key => {
  if (!blockedKeys.has(key)) {
    return;
  }
  const store = await bootstrapStorage();
  // Read the queued value only after the await and lift the block in the same
  // synchronous step: a setItem refused while bootstrap was pending queued a
  // newer value, which must be the one written.
  if (!blockedKeys.has(key)) {
    return;
  }
  const value = blockedKeys.get(key);
  if (value !== undefined) {
    store.set(key, value);
  }
  blockedKeys.delete(key);
};

export const mmkvStorage = {
  getItem: async key => {
    const store = await bootstrapStorage();
    const value = store.getString(key);
    return value === undefined ? null : value;
  },
  setItem: async (key, value) => {
    if (blockedKeys.has(key)) {
      blockedKeys.set(key, value);
      throw new Error(
        `Writes to "${key}" are blocked: its stored copy failed to load`,
      );
    }
    const store = await bootstrapStorage();
    store.set(key, value);
  },
  removeItem: async key => {
    const store = await bootstrapStorage();
    store.remove(key);
  },
};
