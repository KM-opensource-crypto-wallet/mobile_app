// redux-persist `Storage` over the encrypted MMKV state store. The interface is
// promise-based, so readiness lives here: every call awaits bootstrapStorage()
// and then uses MMKV's synchronous JSI API (react-native-mmkv
// docs/WRAPPER_REDUX.md).
import {bootstrapStorage} from './bootstrap';

export const mmkvStorage = {
  getItem: async key => {
    const store = await bootstrapStorage();
    const value = store.getString(key);
    return value === undefined ? null : value;
  },
  setItem: async (key, value) => {
    const store = await bootstrapStorage();
    store.set(key, value);
  },
  removeItem: async key => {
    const store = await bootstrapStorage();
    store.remove(key);
  },
};
