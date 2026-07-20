import {useCallback, useEffect, useState} from 'react';
import dayjs from 'dayjs';

const SCAN_COOLDOWN_HOURS = 24;

/**
 * Tracks the 24h coin-scan cooldown for a wallet.
 * Returns {isAvailable, remainingLabel} where remainingLabel is a live
 * countdown like "5h 12m" while the cooldown is active.
 */
const useCoinScanCooldown = lastCoinsScanTimestamp => {
  const compute = useCallback(() => {
    if (!lastCoinsScanTimestamp) {
      return {isAvailable: true, remainingLabel: ''};
    }
    const lastScan = dayjs(lastCoinsScanTimestamp);
    if (!lastScan.isValid()) {
      return {isAvailable: true, remainingLabel: ''};
    }
    const availableAt = lastScan.add(SCAN_COOLDOWN_HOURS, 'hour');
    const remainingSeconds = availableAt.diff(dayjs(), 'second');
    if (remainingSeconds <= 0) {
      return {isAvailable: true, remainingLabel: ''};
    }
    // Round up so the label never shows "0m" while still locked
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    const remainingLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    return {isAvailable: false, remainingLabel};
  }, [lastCoinsScanTimestamp]);

  const [cooldown, setCooldown] = useState(compute);

  useEffect(() => {
    setCooldown(compute());
    const intervalId = setInterval(() => {
      setCooldown(compute());
    }, 30000);
    return () => clearInterval(intervalId);
  }, [compute]);

  return cooldown;
};

export default useCoinScanCooldown;
