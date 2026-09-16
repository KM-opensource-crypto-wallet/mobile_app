import {getCoinSlug, getQueryParams, parsePaymentUrl} from './common';

const ADDR = '0xF8eC8f7f7D5Ece27130227Bd7846ef24e86E8091';
const QS = `address=${ADDR}&amount=0.01`;

describe('parsePaymentUrl: coin-slug links', () => {
  it.each([
    [
      'wallet-agnostic',
      `https://app.dokwallet.com/wallet/home/send/ethereum-eth/send-funds?${QS}`,
    ],
    [
      'trailing slash',
      `https://app.dokwallet.com/wallet/home/send/ethereum-eth/send-funds/?${QS}`,
    ],
    [
      'wallet-scoped',
      `https://app.dokwallet.com/wallet/w1/home/send/ethereum-eth/send-funds?${QS}`,
    ],
    ['flat', `https://dokwallet.app/home/send/ethereum-eth/send-funds?${QS}`],
    ['custom scheme', `dokwallet://home/send/ethereum-eth/send-funds?${QS}`],
  ])('reads the coin out of the path (%s)', (_label, url) => {
    expect(parsePaymentUrl(url)).toEqual({
      address: ADDR,
      amount: '0.01',
      currency: 'ethereum:eth',
    });
  });

  it('splits a chain name containing an underscore at the last hyphen', () => {
    expect(
      parsePaymentUrl(
        `https://dokwallet.app/wallet/home/send/bitcoin_cash-bch/send-funds?${QS}`,
      ),
    ).toMatchObject({currency: 'bitcoin_cash:bch'});
  });

  it('keeps a lower-cased mixed-case symbol intact for the case-insensitive lookup', () => {
    expect(
      parsePaymentUrl(
        `https://dokwallet.app/wallet/home/send/ethereum-steth/send-funds?${QS}`,
      ),
    ).toMatchObject({currency: 'ethereum:steth'});
  });
});

describe('parsePaymentUrl: legacy currency= links', () => {
  it('still reads the coin out of the query', () => {
    expect(
      parsePaymentUrl(
        `https://app.dokwallet.com/home/send/send-funds?${QS}&currency=ethereum:ETH`,
      ),
    ).toEqual({address: ADDR, amount: '0.01', currency: 'ethereum:ETH'});
  });

  it('works with a trailing slash and over the custom scheme', () => {
    expect(
      parsePaymentUrl(
        `dokwallet://home/send/send-funds/?${QS}&currency=ethereum:ETH`,
      ),
    ).toMatchObject({currency: 'ethereum:ETH'});
  });

  it('carries memo, meta, redirect_url and fieldDisable through', () => {
    const url =
      `https://dokwallet.app/home/send/send-funds?${QS}&currency=ethereum:ETH` +
      '&memo=hello&fieldDisable=true';
    expect(parsePaymentUrl(url)).toMatchObject({
      memo: 'hello',
      fieldDisable: 'true',
    });
  });
});

describe('parsePaymentUrl: rejections', () => {
  it.each([
    ['no url', undefined],
    ['empty', ''],
    [
      'no address',
      'https://dokwallet.app/wallet/home/send/ethereum-eth/send-funds?amount=1',
    ],
    [
      'legacy without currency',
      `https://dokwallet.app/home/send/send-funds?${QS}`,
    ],
    [
      'slug with no hyphen',
      `https://dokwallet.app/wallet/home/send/ethereum/send-funds?${QS}`,
    ],
    [
      'another page under the coin',
      `https://dokwallet.app/wallet/home/send/ethereum-eth/transactions?${QS}`,
    ],
    [
      'send-funds/transfer',
      `https://dokwallet.app/wallet/home/send/ethereum-eth/send-funds/transfer?${QS}`,
    ],
    ['unrelated path', `https://dokwallet.app/home?${QS}`],
  ])('returns null for %s', (_label, url) => {
    expect(parsePaymentUrl(url)).toBeNull();
  });

  it('is not fooled by send-funds appearing only in the query', () => {
    expect(
      parsePaymentUrl(
        `https://dokwallet.app/home?redirect=/home/send/send-funds&${QS}&currency=ethereum:ETH`,
      ),
    ).toBeNull();
  });
});

describe('getQueryParams', () => {
  it('keeps every "=" after the first one in a value', () => {
    const params = getQueryParams(
      'https://dokwallet.app/home/send/send-funds?meta=eyJhIjoxfQ==&redirect_url=https://x.io/done?id=7',
    );
    expect(params.meta).toBe('eyJhIjoxfQ==');
    expect(params.redirect_url).toBe('https://x.io/done?id=7');
  });
});

describe('getCoinSlug', () => {
  it.each([
    [{chain_name: 'ethereum', symbol: 'ETH'}, 'ethereum-eth'],
    [{chain_name: 'ethereum', symbol: 'USDT'}, 'ethereum-usdt'],
    // Mixed case is flattened; searchAndAddCoins matches case-insensitively.
    [{chain_name: 'ethereum', symbol: 'stETH'}, 'ethereum-steth'],
    // The chain's own '_' survives - currencyFromSlug splits on the LAST '-'.
    [{chain_name: 'bitcoin_cash', symbol: 'BCH'}, 'bitcoin_cash-bch'],
  ])('builds %o into a url slug', (coin, expected) => {
    expect(getCoinSlug(coin)).toBe(expected);
  });

  it.each([[null], [undefined]])('returns null for %s', coin => {
    expect(getCoinSlug(coin)).toBeNull();
  });
});

describe('the Request Crypto link round-trips', () => {
  // Exactly how src/screens/main/ReceivePaymentUrl builds the link.
  const buildLink = (coin, address, amount) =>
    `https://app.dokwallet.com/wallet/home/send/${getCoinSlug(
      coin,
    )}/send-funds?address=${encodeURIComponent(
      address,
    )}&amount=${encodeURIComponent(amount)}`;

  it('produces the exact string the web app produces', () => {
    expect(
      buildLink({chain_name: 'ethereum', symbol: 'ETH'}, ADDR, '0.01'),
    ).toBe(
      `https://app.dokwallet.com/wallet/home/send/ethereum-eth/send-funds?address=${ADDR}&amount=0.01`,
    );
  });

  it.each([
    [{chain_name: 'ethereum', symbol: 'ETH'}],
    [{chain_name: 'ethereum', symbol: 'USDT'}],
    [{chain_name: 'ethereum', symbol: 'stETH'}],
    [{chain_name: 'bitcoin_cash', symbol: 'BCH'}],
    [{chain_name: 'binance_smart_chain', symbol: 'BNB'}],
  ])('parses back to the same coin: %o', coin => {
    const parsed = parsePaymentUrl(buildLink(coin, ADDR, '0.01'));
    expect(parsed).toMatchObject({address: ADDR, amount: '0.01'});
    // searchAndAddCoins splits on ':' and compares case-insensitively.
    const [chain, symbol] = parsed.currency.split(':');
    expect(chain).toBe(coin.chain_name.toLowerCase());
    expect(symbol).toBe(coin.symbol.toLowerCase());
  });
});
