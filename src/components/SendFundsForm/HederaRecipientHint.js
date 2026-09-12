import React, {useContext, useEffect, useState} from 'react';
import {Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './SendFundsFormStyles';

const HEDERA_LOOKUP_DEBOUNCE_MS = 400;

// Hedera recipients can be typed as an EVM address or a `0.0.N` account id;
// show the other identifier, or warn that a brand-new address will be
// auto-created at the sender's expense. `getChain` must be memoized by the
// caller: it is an effect dependency and an unstable ref restarts the debounce.
const HederaRecipientHint = ({address, getChain}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [info, setInfo] = useState(null);
  const value = address?.trim() || '';
  useEffect(() => {
    if (!value) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await getChain().lookupAddressIdentifiers({
          address: value,
        });
        if (!cancelled) {
          setInfo({value, ...result});
        }
      } catch (e) {
        if (!cancelled) {
          setInfo(null);
        }
      }
    }, HEDERA_LOOKUP_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, getChain]);
  if (!info || info.value !== value) {
    return null;
  }
  let text = null;
  if (info.inputType === 'accountId') {
    text = !info.exists
      ? 'Account not found'
      : info.evmAddress
      ? `EVM address: ${info.evmAddress}`
      : null;
  } else if (info.inputType === 'evmAddress') {
    text = info.exists
      ? `Account ID: ${info.accountId}`
      : 'New account. A one-time account creation fee is added to the network fee.';
  }
  if (!text) {
    return null;
  }
  return <Text style={styles.infoText}>{text}</Text>;
};

export default HederaRecipientHint;
