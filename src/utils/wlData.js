import {getBundleId} from 'react-native-device-info';
import {setWhiteLabelIdToDokApi} from 'dok-wallet-blockchain-networks/config/dokApi';

const bundleId = getBundleId();

const WLObj = {
  'com.dok.wallet': 'dokwallet',
  'com.kimlwallet': 'kimlwallet',
};

export const wlName = WLObj[bundleId];
export const IS_KIML_WALLET = wlName === 'kimlwallet';
export const IS_DOK_WALLET = wlName === 'dokwallet';

const WHITE_LABEL_ID_OBJ = {
  dokwallet: '656d95510a58ec43999a0f77',
  kimlwallet: '65efefca5f95b9f06cc8f9eb',
};

export const WHITE_LABEL_ID = WHITE_LABEL_ID_OBJ[wlName];
setWhiteLabelIdToDokApi(WHITE_LABEL_ID);

const IOS_GOOGLE_CLIENT_ID_OBJ = {
  dokwallet: process.env.DOK_WALLET_GOOGLE_IOS_CLIENT_ID,
  kimlwallet: process.env.KIML_WALLET_GOOGLE_IOS_CLIENT_ID,
};

export const IOS_GOOGLE_CLIENT_ID = IOS_GOOGLE_CLIENT_ID_OBJ[wlName];

const ANDROID_GOOGLE_CLIENT_ID_OBJ = {
  dokwallet: process.env.DOK_WALLET_GOOGLE_ANDROID_CLIENT_ID,
  kimlwallet: process.env.KIML_WALLET_GOOGLE_ANDROID_CLIENT_ID,
};

export const ANDROID_GOOGLE_CLIENT_ID = ANDROID_GOOGLE_CLIENT_ID_OBJ[wlName];

const WEB_GOOGLE_CLIENT_ID_OBJ = {
  dokwallet: process.env.DOK_WALLET_GOOGLE_WEB_CLIENT_ID,
  kimlwallet: process.env.KIML_WALLET_GOOGLE_WEB_CLIENT_ID,
};

export const WEB_GOOGLE_CLIENT_ID = WEB_GOOGLE_CLIENT_ID_OBJ[wlName];

const IOS_APPSTORE_URL_OBJ = {
  dokwallet: 'itms-apps://apps.apple.com/app/id1533065700?mt=8',
  kimlwallet: 'itms-apps://apps.apple.com/app/id6746929530?mt=8',
};

export const IOS_APPSTORE_URL = IOS_APPSTORE_URL_OBJ[wlName];

// Use static require paths inside a mapping
const logoMap = {
  dokwallet: {
    logo: require('assets/dokwallet/logo.svg').default,
    logoDark: require('assets/dokwallet/logo_dark.svg').default,
    logoSingle: require('assets/dokwallet/logoSingle.svg').default,
    logoSingleDark: require('assets/dokwallet/logoSingleDark.svg').default,
    createWallet: require('assets/dokwallet/create_wallet.svg').default,
    importWallet: require('assets/dokwallet/import_wallet.svg').default,
    onboarding1: require('assets/dokwallet/onboarding1.png'),
    onboarding2: require('assets/dokwallet/onboarding2.png'),
    onboarding3: require('assets/dokwallet/onboarding3.png'),
    onboarding4: require('assets/dokwallet/onboarding4.png'),
    card: require('assets/dokwallet/card.png'),
    card2: require('assets/dokwallet/card2.png'),
  },
  kimlwallet: {
    logo: require('assets/kimlwallet/logo.svg').default,
    logoDark: require('assets/kimlwallet/logo_dark.svg').default,
    logoSingle: require('assets/kimlwallet/logoSingle.svg').default,
    logoSingleDark: require('assets/kimlwallet/logoSingleDark.svg').default,
    createWallet: require('assets/kimlwallet/create_wallet.svg').default,
    importWallet: require('assets/kimlwallet/import_wallet.svg').default,
    onboarding1: require('assets/kimlwallet/onboarding1.png'),
    onboarding2: require('assets/kimlwallet/onboarding2.png'),
    onboarding3: require('assets/kimlwallet/onboarding3.png'),
    onboarding4: require('assets/kimlwallet/onboarding4.png'),
    card: require('assets/kimlwallet/card.png'),
    card2: require('assets/kimlwallet/card2.png'),
  },
};

export const LOGO = logoMap[wlName].logo;
export const LOGO_DARK = logoMap[wlName].logoDark;
export const LOGO_SINGLE = logoMap[wlName].logoSingle;
export const LOGO_SINGLE_DARK = logoMap[wlName].logoSingleDark;
export const IMPORT_WALLET = logoMap[wlName].importWallet;
export const CREATE_WALLET = logoMap[wlName].createWallet;

export const ONBOARDING_1 = logoMap[wlName].onboarding1;
export const ONBOARDING_2 = logoMap[wlName].onboarding2;
export const ONBOARDING_3 = logoMap[wlName].onboarding3;
export const ONBOARDING_4 = logoMap[wlName].onboarding4;
export const CARD = logoMap[wlName].card;
export const CARD_2 = logoMap[wlName].card2;

const AppNameObj = {
  dokwallet: 'Dok Wallet',
  kimlwallet: 'KIML Wallet',
};

export const WL_APP_NAME = AppNameObj[wlName];

const ContactDetailsObj = {
  dokwallet: {
    email: 'support@dokwallet.com',
    telegram: 't.me/dokwallet',
  },
  kimlwallet: {
    email: 'contact@kimlview.com',
    telegram: 't.me/kimlwallet',
  },
};

export const CONTACT_DETAILS = ContactDetailsObj[wlName];

const UrlObj = {
  dokwallet: {
    privacyPolicy: 'https://dokwallet.com/privacypolicy.html',
    terms: 'https://dokwallet.com/terms.html',
    appUrl: 'https://www.dokwallet.app',
  },
  kimlwallet: {
    privacyPolicy: 'https://kimlview.com/privacy-policy.html',
    terms: 'https://kimlview.com/terms-and-conditions.html',
    appUrl: 'https://www.kimlview.xyz',
  },
};

export const URLData = UrlObj[wlName];

const WlWalletConnectObj = {
  dokwallet: {
    id: process.env.DOKWALLET_WALLET_CONNECT_ID,
    metadata: {
      description: 'Dokwallet',
      icons: [
        'https://moreover4u2-wl-resources.s3.eu-north-1.amazonaws.com/dokwallet/dokwallet_200.png',
      ],
      name: 'Dokwallet',
      ssl: true,
      url: 'https://dokwallet.com',
    },
  },
  kimlwallet: {
    id: process.env.KIMLWALLET_WALLET_CONNECT_ID,
    metadata: {
      description: 'KIML Wallet',
      icons: [
        'https://moreover4u2-wl-resources.s3.eu-north-1.amazonaws.com/kimlview/logo.png',
      ],
      name: 'KIML Wallet',
      ssl: true,
      url: 'https://kimlview.com',
    },
  },
};

export const WALLET_CONNECT_DATA = WlWalletConnectObj[wlName];
