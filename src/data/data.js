import {
  CARD,
  CARD_2,
  IS_DOK_WALLET,
  ONBOARDING_1,
  ONBOARDING_2,
  ONBOARDING_3,
  ONBOARDING_4,
} from '../utils/wlData';

const data = IS_DOK_WALLET
  ? [
    {
      title: 'Multi-currency Support',
      body: 'Store, send, receive and exchange primary crypto currencies like BTC, LTC, ETH and more.',
      src: ONBOARDING_1,
    },
    {
      title: 'Buy Crypto',
      body: 'Buy crypto directly from the app with a credit/debit card!',
      src: ONBOARDING_2,
    },
    {
      title: 'Convenient biometric authentication login',
      body: 'Keep all your assets secure with our biometric authentication-based login.',
      src: ONBOARDING_3,
    },
    {
      title: 'The best place to store your crypto assets.',
      body: 'Store all your crypto assets in one place with our user-friendly wallet.',
      src: ONBOARDING_4,
    },
  ]
  : [
    {
      title: 'Multi-currency Support',
      body: 'send and receive primary crypto currencies like BTC, LTC, ETH and more.',
      src: ONBOARDING_1,
    },

    {
      title: 'Convenient biometric authentication login',
      body: 'Keep all your assets secure with our biometric authentication-based login.',
      src: ONBOARDING_3,
    },
  ];

export default data;

import CloudCheck from '../assets/images/icons/cloud-check.svg';
import Edit from '../assets/images/icons/edit.svg';

export const google = <CloudCheck height="30" width="30" />;
export const manual = <Edit height="30" width="30" />;

export const wallet = [
  // {
  //   title: 'Google Drive Backup',
  //   body: 'Not active',
  //   icon: google,
  // },
  {
    title: 'Manual Backup',
    body: 'Active',
    icon: manual,
  },
];

export const cards = [
  {
    src: CARD,
  },
  {
    src: CARD_2,
  },
];
