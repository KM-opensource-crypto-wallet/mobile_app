import {IS_ANDROID} from 'utils/dimensions';
import {getBuildNumber, getVersion} from 'react-native-device-info';
import crypto from 'react-native-quick-crypto';
import {Linking} from 'react-native';
import {Platform} from 'react-native';

export const inAppBrowserOptions = IS_ANDROID
  ? {
      forceCloseOnRedirection: false,
      showInRecents: true,
    }
  : {modalEnabled: true};

export const parseBoolean = value => value === 'true' || value === true;

export const parseJson = value => {
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn('Failed to parse JSON:', e);
    return value;
  }
};

export async function generateSHA256ForCoins(coins, isEVMChain) {
  const coinData = Array.isArray(coins) ? coins : [];
  if (coinData.length) {
    let coinNames = [];
    for (let i = 0; i < coinData.length; i++) {
      const item = coinData[i];
      const str = `${
        isEVMChain(item?.chain_name) ? 'ETH' : item.chain_symbol
      }:${item.address}`;
      if (item?.type === 'coin' && !coinNames.includes(str)) {
        coinNames.push(str);
      }
    }
    return Promise.all(
      coinNames.map(item =>
        crypto.createHash('sha256').update(item).digest('hex'),
      ),
    );
  }
  return [];
}

export const APP_VERSION = `${getVersion()}_${getBuildNumber()}`;

export function randomNumber(min, max) {
  return crypto.randomInt(min, max);
}

export const parseUrlQS = url => {
  try {
    let params = {};
    if (url) {
      const queryString = url.split('?')[1];
      if (queryString) {
        const pairs = queryString.split('&');
        pairs.forEach(pair => {
          const [key, value] = pair.split('=');
          params[key] = value;
        });
      }
    }
    return params;
  } catch (e) {
    console.error('Error in parsing the url', e);
    return {};
  }
};

export const validatePaymentUrl = (url, qsObj) => {
  try {
    return !!(
      url?.includes('home/send/send-funds') &&
      qsObj?.address &&
      qsObj?.currency
    );
  } catch (e) {
    console.error('Error in validatePaymentUrl', e);
    return false;
  }
};

export const validateWCUrl = (url, qsObj) => {
  try {
    return !!(url?.includes('/wc') && qsObj?.uri);
  } catch (e) {
    console.error('Error in validateWCUrl', e);
    return false;
  }
};

export const getQueryParams = url => {
  try {
    // Check if URL has query parameters
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1 || queryIndex === url.length - 1) {
      return {};
    }

    // Extract query string
    const queryString = url.substring(queryIndex + 1);

    // Check if query string is empty
    if (!queryString || queryString.trim() === '') {
      return {};
    }

    const params = {};

    // Split by & and parse each pair
    const pairs = queryString.split('&').filter(pair => pair.length > 0);

    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      const cleanKey = key?.trim();

      if (cleanKey && cleanKey.length > 0) {
        params[decodeURIComponent(cleanKey)] = value
          ? decodeURIComponent(value)
          : '';
      }
    });

    return params;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return {};
  }
};

function safelyStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (e) {
    return data;
  }
}

export const handleTransferRedirect = async (
  redirect_url,
  tx_hash,
  status,
  meta = null,
) => {
  try {
    const decodedUrl = decodeURIComponent(redirect_url);
    const url = new URL(decodedUrl);

    // Add required params
    url.searchParams.set('tx_hash', tx_hash);
    url.searchParams.set('status', status);

    // Add meta params if provided
    if (meta) {
      url.searchParams.set('meta', safelyStringify(meta));
    }

    await Linking.openURL(url.toString());
  } catch (error) {
    console.error('Failed to open redirect URL:', error);
    throw error;
  }
};

export const Constants = {
  lastAttempt: {
    title: 'Last Attempt',
    subTitle:
      'You have one more attempt if you type a wrong password again your wallet will delete completely.',
  },
};

export const formatNumber = num => {
  const n = parseFloat(num);
  if (!num || isNaN(n)) {
    return '0';
  }
  if (n >= 1e12) {
    return (n / 1e12).toFixed(2) + ' T';
  } else if (n >= 1e9) {
    return (n / 1e9).toFixed(2) + ' B';
  } else if (n >= 1e6) {
    return (n / 1e6).toFixed(2) + ' M';
  } else if (n >= 1e3) {
    return (n / 1e3).toFixed(2) + ' Th';
  } else {
    return n.toString();
  }
};
