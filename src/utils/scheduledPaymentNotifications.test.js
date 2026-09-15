import notifee from '@notifee/react-native';
import {
  cancelDisplayedRemindersForPayment,
  getPaymentIdsWithDisplayedReminders,
} from 'utils/scheduledPaymentNotifications';

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getDisplayedNotifications: jest.fn(),
    cancelDisplayedNotification: jest.fn(() => Promise.resolve()),
    createChannel: jest.fn(),
    createTriggerNotification: jest.fn(),
    cancelNotification: jest.fn(),
    getTriggerNotificationIds: jest.fn(() => Promise.resolve([])),
    requestPermission: jest.fn(),
  },
  AndroidImportance: {HIGH: 4},
  AndroidVisibility: {PRIVATE: 0},
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0},
  RepeatFrequency: {DAILY: 1, WEEKLY: 2},
  TriggerType: {TIMESTAMP: 0},
}));

// The module pulls these in only for building notification copy / hidden-wallet
// filtering; neither is exercised here and both drag in chain code.
jest.mock('dok-wallet-blockchain-networks/helper', () => ({
  getCustomizePublicAddress: address => address,
}));
jest.mock(
  'dok-wallet-blockchain-networks/redux/wallets/walletsSelector',
  () => ({
    isWalletHiddenAndLocked: () => false,
    selectAllWallets: () => [],
  }),
);

const displayed = ids => ids.map(id => ({id, notification: {id}}));

describe('getPaymentIdsWithDisplayedReminders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps trigger ids back to their payment ids', async () => {
    notifee.getDisplayedNotifications.mockResolvedValue(
      displayed(['pay-1::0', 'pay-1::3', 'pay-2::rd']),
    );
    await expect(getPaymentIdsWithDisplayedReminders()).resolves.toEqual(
      new Set(['pay-1', 'pay-2']),
    );
  });

  it('ignores notifications this feature did not create', async () => {
    notifee.getDisplayedNotifications.mockResolvedValue(
      displayed(['marketing-blast', 'pay-1::0']),
    );
    await expect(getPaymentIdsWithDisplayedReminders()).resolves.toEqual(
      new Set(['pay-1']),
    );
  });

  it('rejects rather than reporting an empty tray', async () => {
    notifee.getDisplayedNotifications.mockRejectedValue(new Error('denied'));
    await expect(getPaymentIdsWithDisplayedReminders()).rejects.toThrow(
      'denied',
    );
  });
});

describe('cancelDisplayedRemindersForPayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears only that payment, and never its pending trigger', async () => {
    notifee.getDisplayedNotifications.mockResolvedValue(
      displayed(['pay-1::0', 'pay-1::rd', 'pay-2::0', 'other']),
    );
    await cancelDisplayedRemindersForPayment('pay-1');
    expect(
      notifee.cancelDisplayedNotification.mock.calls.map(([id]) => id).sort(),
    ).toEqual(['pay-1::0', 'pay-1::rd']);
    // cancelNotification would also drop pay-1's next daily repeat.
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
  });

  it('stays quiet when the tray cannot be read', async () => {
    notifee.getDisplayedNotifications.mockRejectedValue(new Error('denied'));
    await expect(
      cancelDisplayedRemindersForPayment('pay-1'),
    ).resolves.toBeUndefined();
    expect(notifee.cancelDisplayedNotification).not.toHaveBeenCalled();
  });
});
