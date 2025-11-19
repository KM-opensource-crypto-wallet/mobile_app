import { getBundleId } from 'react-native-device-info';
import { setWhiteLabelIdToDokApi } from 'dok-wallet-blockchain-networks/config/dokApi';
import { DokWalletCard, DokWalletCard2, DokWalletCreateWallet, DokWalletImportWallet, DokWalletLogoDark, DokWalletLogoSingle, DokWalletLogoSingleDark, DokWalletOnboarding1, DokWalletOnboarding2, DokWalletOnboarding3, DokWalletOnboarding4, KimlCard, KimlCard2, KimlOnboarding1, KimlOnboarding2, KimlOnboarding3, KimlOnboarding4, KimlSvgCreateWalletLogo, KimlSvgImportWalletLogo, KimlSvgLogo, KimlSvgLogoDark, KimlSvgLogoSingle, KimlSvgLogoSingleDark, SvgDokLogo, SvgKimlLogo } from 'src/assets';

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

const IOS_APPSTORE_URL_OBJ = {
  dokwallet: 'itms-apps://apps.apple.com/app/id1533065700?mt=8',
  kimlwallet: 'itms-apps://apps.apple.com/app/id6746929530?mt=8',
};

export const IOS_APPSTORE_URL = IOS_APPSTORE_URL_OBJ[wlName];

// Use static require paths inside a mapping
const logoMap = {
  dokwallet: {
    logo: SvgDokLogo,
    logoDark: DokWalletLogoDark,
    logoSingle: DokWalletLogoSingle,
    logoSingleDark: DokWalletLogoSingleDark,
    createWallet: DokWalletCreateWallet,
    importWallet: DokWalletImportWallet,
    onboarding1: DokWalletOnboarding1,
    onboarding2: DokWalletOnboarding2,
    onboarding3: DokWalletOnboarding3,
    onboarding4: DokWalletOnboarding4,
    card: DokWalletCard,
    card2: DokWalletCard2,
  },
  kimlwallet: {
    logo: KimlSvgLogo,
    logoDark: KimlSvgLogoDark,
    logoSingle: KimlSvgLogoSingle,
    logoSingleDark: KimlSvgLogoSingleDark,
    createWallet: KimlSvgCreateWalletLogo,
    importWallet: KimlSvgImportWalletLogo,
    onboarding1: KimlOnboarding1,
    onboarding2: KimlOnboarding2,
    onboarding3: KimlOnboarding3,
    onboarding4: KimlOnboarding4,
    card: KimlCard,
    card2: KimlCard2,
  },
};

export const LOGO = logoMap[wlName];
export const LOGO_DARK = logoMap[wlName];
export const LOGO_SINGLE = logoMap[wlName];
export const LOGO_SINGLE_DARK = logoMap[wlName];
export const IMPORT_WALLET = logoMap[wlName];
export const CREATE_WALLET = logoMap[wlName];

export const ONBOARDING_1 = logoMap[wlName];
export const ONBOARDING_2 = logoMap[wlName];
export const ONBOARDING_3 = logoMap[wlName];
export const ONBOARDING_4 = logoMap[wlName];
export const CARD = logoMap[wlName];
export const CARD_2 = logoMap[wlName];

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
