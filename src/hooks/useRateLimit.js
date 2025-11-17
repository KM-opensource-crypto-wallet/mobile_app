import {useCallback, useEffect, useState} from 'react';
import {
  getAsyncStorageData,
  removeAsyncStorageData,
  storeAsyncStorageData,
} from 'utils/asyncStorage';

export function useRateLimit({
  key = 'login_attempts',
  maxAttempts = 5,
  windowMs = 1 * 60 * 1000, // 1 minutes
} = {}) {
  const [attempts, setAttempts] = useState([]);
  const [isLocked, setIsLocked] = useState(false);

  // Remove old attempts (outside time window)
  const filterOldAttempts = useCallback(
    arr => {
      const now = Date.now();
      return arr.filter(ts => now - ts < windowMs);
    },
    [windowMs],
  );

  const loadAttempts = useCallback(async () => {
    const stored = await getAsyncStorageData(key);
    const parsed = stored ? JSON.parse(stored) : [];
    const cleaned = filterOldAttempts(parsed);

    setAttempts(cleaned);
    setIsLocked(cleaned.length >= maxAttempts);
  }, [filterOldAttempts, key, maxAttempts]);

  const saveAttempts = useCallback(
    async arr => {
      await storeAsyncStorageData(key, JSON.stringify(arr));
    },
    [key],
  );

  // Call when login fails
  const recordFailure = useCallback(async () => {
    const now = Date.now();
    let updated = filterOldAttempts(attempts);
    updated.push(now);

    if (updated.length >= maxAttempts) {
      setIsLocked(true);
    }

    setAttempts(updated);
    await saveAttempts(updated);

    return updated.length; // return current number of failures
  }, [attempts, filterOldAttempts, maxAttempts, saveAttempts]);

  // Call on successful login
  const resetAttempts = useCallback(async () => {
    await removeAsyncStorageData(key);
    setAttempts([]);
    setIsLocked(false);
  }, [key]);

  // Load attempts on mount
  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  return {
    attempts,
    isLocked,
    recordFailure,
    resetAttempts,
    maxAttempts,
  };
}
