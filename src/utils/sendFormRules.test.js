// The real helper/index.js pulls in react-native; only validateNumber is used.
jest.mock('dok-wallet-blockchain-networks/helper', () => ({
  validateNumber: number => {
    const n = Number(number);
    return isNaN(n) || !Number.isFinite(n) ? null : n;
  },
}));

import {validateChainRules} from './sendFormRules';

describe('validateChainRules', () => {
  it('passes for chains without rules', () => {
    expect(
      validateChainRules({
        chain_name: 'ethereum',
        values: {amount: '0.5', memo: 'abc'},
        availableAmount: '1',
      }),
    ).toBeNull();
  });

  describe('polkadot', () => {
    it('warns when the remainder would drop under the 1.1 DOT reserve', () => {
      const result = validateChainRules({
        chain_name: 'polkadot',
        values: {amount: '9.5'},
        availableAmount: '10',
      });
      expect(result.toast.title).toBe('Polkadot warning');
    });
    it('allows sending the full balance', () => {
      expect(
        validateChainRules({
          chain_name: 'polkadot',
          values: {amount: '10'},
          availableAmount: '10',
        }),
      ).toBeNull();
    });
    it('allows a send that leaves the reserve intact', () => {
      expect(
        validateChainRules({
          chain_name: 'polkadot',
          values: {amount: '5'},
          availableAmount: '10',
        }),
      ).toBeNull();
    });
  });

  describe('cardano', () => {
    it('requires at least 1 ADA', () => {
      expect(
        validateChainRules({
          chain_name: 'cardano',
          values: {amount: '0.5'},
          availableAmount: '10',
        }),
      ).toEqual({
        field: 'amount',
        message: 'minimum 1 ADA is required for transaction',
      });
    });
    it('rejects a remainder under 1 ADA unless sending max', () => {
      expect(
        validateChainRules({
          chain_name: 'cardano',
          values: {amount: '9.5'},
          availableAmount: '10',
        }).field,
      ).toBe('amount');
      expect(
        validateChainRules({
          chain_name: 'cardano',
          values: {amount: '10'},
          availableAmount: '10',
        }),
      ).toBeNull();
    });
  });

  describe('ripple', () => {
    it('rejects a non-numeric memo', () => {
      expect(
        validateChainRules({
          chain_name: 'ripple',
          values: {amount: '1', memo: 'hello'},
          availableAmount: '10',
        }).toast.title,
      ).toBe('Invalid MEMO or TAG');
    });
    it('accepts a numeric memo, including 0, and an empty memo', () => {
      const base = {chain_name: 'ripple', availableAmount: '10'};
      expect(
        validateChainRules({...base, values: {amount: '1', memo: '12345'}}),
      ).toBeNull();
      expect(
        validateChainRules({...base, values: {amount: '1', memo: '0'}}),
      ).toBeNull();
      expect(
        validateChainRules({...base, values: {amount: '1', memo: ''}}),
      ).toBeNull();
    });
  });
});
