import {IS_ANDROID} from 'utils/dimensions';
import {getBuildNumber, getVersion} from 'react-native-device-info';
import crypto from 'react-native-quick-crypto';
import {Linking} from 'react-native';
import {Platform} from 'react-native';
import {markExpectedBackground} from 'utils/expectedBackground';

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

// A payment link comes in two shapes. The coin used to ride in a
// `currency=<chain_name>:<symbol>` query param; web now puts it in a path slug
// (`ethereum-eth`). Both must keep working - links of the old shape are already
// in the wild and this app still generates them.
const LEGACY_PATH_RE = /\/home\/send\/send-funds\/?$/;
// Anchored at the tail, so one pattern covers every prefix web produces:
// /wallet/home/send/<slug>/send-funds, /wallet/<clientId>/home/send/<slug>/...
// and the bare /home/send/<slug>/send-funds.
const SLUG_PATH_RE = /\/home\/send\/([^/]+)\/send-funds\/?$/;

// chain_name uses '_' (bitcoin_cash), so the LAST '-' splits chain from symbol.
const currencyFromSlug = slug => {
  const cut = slug.lastIndexOf('-');
  if (cut <= 0 || cut === slug.length - 1) {
    return null;
  }
  return `${slug.slice(0, cut)}:${slug.slice(cut + 1)}`;
};

// URL identifier for a coin: `${chain_name}-${symbol}`, lower-cased, e.g.
// `ethereum-usdt`. The inverse of currencyFromSlug above, and identical to the
// web app's getCoinSlug - the two apps have to agree on this string. Returns
// null for a missing coin so callers do not build "undefined-undefined".
export const getCoinSlug = coin =>
  coin ? `${coin?.chain_name}-${coin?.symbol}`.toLowerCase() : null;

// Returns the payment payload (always including a `currency`, whichever shape
// the link used) or null when the url is not a payment link.
export const parsePaymentUrl = url => {
  try {
    if (!url) {
      return null;
    }
    // Deliberately not `new URL()`: for a non-special scheme such as
    // `dokwallet://home/send/send-funds` it treats `home` as the host and
    // mangles the path. The custom scheme has to keep working.
    const path = url.split('#')[0].split('?')[0];
    const params = getQueryParams(url);

    let currency = null;
    if (LEGACY_PATH_RE.test(path)) {
      currency = params?.currency || null;
    } else {
      const slug = SLUG_PATH_RE.exec(path)?.[1];
      currency = slug ? currencyFromSlug(slug) : null;
    }

    if (!currency || !params?.address) {
      return null;
    }
    return {...params, currency};
  } catch (e) {
    console.error('Error in parsePaymentUrl', e);
    return null;
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
      // Only the FIRST '=' separates key from value - a base64 `meta` or a
      // `redirect_url` with its own query string keeps the rest of them.
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
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

    markExpectedBackground();
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
