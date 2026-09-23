// ZcashCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.coinswallet.Utils;

import wallet.core.jni.Base58;
import wallet.core.jni.CoinType;
import wallet.core.jni.Hash;
import wallet.core.jni.HDWallet;
import wallet.core.jni.PrivateKey;
import wallet.core.jni.PublicKey;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

// WalletCore has no dedicated testnet Derivation case for Zcash (unlike
// Bitcoin's BITCOINTESTNET), and CoinType.ZCASH only encodes mainnet
// address version bytes. So testnet is derived manually with the universal
// BIP44 testnet coin_type (1'), and the address is base58check-encoded by
// hand with Zcash's testnet transparent-address prefix. Mirrors
// ios/ZcashCoin.swift.
public class ZcashCoin extends CoinFactory.Coin {
    private final HDWallet wallet;
    // Zcash reuses Bitcoin's WIF version bytes on both networks: a
    // t-address private key is byte-for-byte the same WIF encoding as a
    // Bitcoin one, only the public address version bytes differ.
    byte[] prefix = new byte[]{(byte) 0x80};
    byte[] testnetPrefix = new byte[]{(byte) 0xef};

    // Zcash transparent P2PKH testnet address prefix (2 bytes, unlike
    // Bitcoin's 1-byte prefix): tm... = 0x1D25. Mainnet (t1... = 0x1CB8) is
    // handled by CoinType.ZCASH.deriveAddress below.
    private static final byte[] TESTNET_ADDRESS_PREFIX = new byte[]{(byte) 0x1d, (byte) 0x25};

    public ZcashCoin(String mnemonic) {
        super(mnemonic);
        this.wallet = super.wallet;
    }

    // SLIP-44 zcash = 133'. Must stay in step with getAccountBasePath's
    // testnet convention for other coins (coin_type 1') and with the
    // mainnet prefix ZcashChain.js uses for address encoding.
    @Override
    public String accountBasePath(Boolean isTestNet) {
        return Boolean.TRUE.equals(isTestNet) ? "m/44'/1'/0'" : "m/44'/133'/0'";
    }

    private PrivateKey zcashKey(String derivePath) {
        return wallet.getKey(CoinType.ZCASH, derivePath);
    }

    private String zcashAddress(PrivateKey privateKey, Boolean isTestNet) {
        if (!Boolean.TRUE.equals(isTestNet)) {
            return CoinType.ZCASH.deriveAddress(privateKey);
        }
        PublicKey publicKey = privateKey.getPublicKeySecp256k1(true);
        byte[] pubkeyHash = Hash.sha256RIPEMD(publicKey.data());
        byte[] payload = new byte[TESTNET_ADDRESS_PREFIX.length + pubkeyHash.length];
        System.arraycopy(TESTNET_ADDRESS_PREFIX, 0, payload, 0, TESTNET_ADDRESS_PREFIX.length);
        System.arraycopy(pubkeyHash, 0, payload, TESTNET_ADDRESS_PREFIX.length, pubkeyHash.length);
        return Base58.encode(payload);
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        PrivateKey privateKey = zcashKey(accountBasePath(isTestNet) + "/0/0");
        return zcashAddress(privateKey, isTestNet);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        byte[] privateKeyBytes = zcashKey(accountBasePath(isTestNet) + "/0/0").data();
        return Utils.convertPrivateKeytoWIF(privateKeyBytes, Boolean.TRUE.equals(isTestNet), prefix, testnetPrefix);
    }

    @Override
    public ReadableMap addCustomDerivation(String derivePath, Boolean isTestNet) {
        PrivateKey privateKey = zcashKey(derivePath);
        WritableMap obj = Arguments.createMap();
        obj.putString("derivePath", derivePath);
        obj.putString("privateKey", Utils.convertPrivateKeytoWIF(privateKey.data(), Boolean.TRUE.equals(isTestNet), prefix, testnetPrefix));
        obj.putString("address", zcashAddress(privateKey, isTestNet));
        return obj;
    }

    @Override
    public ReadableArray getDeriveAddresses(Boolean isTestNet) {
        // BIP44 standard: 20 external/receive (…/0/i) + 20 internal/change (…/1/i)
        WritableArray result = Arguments.createArray();
        appendDeriveAddressRange(result, 0, 0, 20, isTestNet);
        appendDeriveAddressRange(result, 1, 0, 20, isTestNet);
        return result;
    }

    @Override
    public String signTransaction(String rawData) {
        // Real signing happens in JS (ZcashChain.js builds and signs v4
        // transactions itself). Every other coin stubs this the same way.
        return null;
    }
}
