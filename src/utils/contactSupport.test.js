import {Linking} from 'react-native';
import {getSupportId} from 'services/logger';
import {
  buildSupportEmailUrl,
  buildSupportTelegramUrl,
  openSupportEmail,
  openSupportTelegram,
} from './contactSupport';

jest.mock('services/logger', () => ({getSupportId: jest.fn()}));
jest.mock('utils/expectedBackground', () => ({
  markExpectedBackground: jest.fn(),
}));
jest.mock('utils/wlData', () => ({
  CONTACT_DETAILS: {
    email: 'support@dokwallet.com',
    telegram: 'https://t.me/dokwallet',
  },
  WL_APP_NAME: 'Dok Wallet',
}));

const SUPPORT_ID = '1a0fc14f-b769-48e7-9df8-b9605282da40';
const DRAFT = 'Support%20ID%3A%201a0fc14f-b769-48e7-9df8-b9605282da40%0A%0A';

beforeEach(() => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('prefills the full Support ID in the support email', () => {
  getSupportId.mockReturnValue(SUPPORT_ID);
  expect(buildSupportEmailUrl()).toBe(
    `mailto:support@dokwallet.com?subject=Dok%20Wallet%20support&body=${DRAFT}`,
  );
});

it('prefills the full Support ID as the Telegram draft', () => {
  getSupportId.mockReturnValue(SUPPORT_ID);
  expect(buildSupportTelegramUrl()).toBe(
    `https://t.me/dokwallet?text=${DRAFT}`,
  );
});

it('leaves the draft out when there is no Support ID yet', () => {
  getSupportId.mockReturnValue('');
  expect(buildSupportEmailUrl()).toBe(
    'mailto:support@dokwallet.com?subject=Dok%20Wallet%20support',
  );
  expect(buildSupportTelegramUrl()).toBe('https://t.me/dokwallet');
});

it('opens the email and Telegram links', async () => {
  getSupportId.mockReturnValue(SUPPORT_ID);
  await openSupportEmail();
  await openSupportTelegram();
  expect(Linking.openURL).toHaveBeenNthCalledWith(1, buildSupportEmailUrl());
  expect(Linking.openURL).toHaveBeenNthCalledWith(2, buildSupportTelegramUrl());
});
