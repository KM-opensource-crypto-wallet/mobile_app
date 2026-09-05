// BitcoinLegacyCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.coinswallet.Utils;

import wallet.core.jni.BitcoinAddress;
import wallet.core.jni.Derivation;
import wallet.core.jni.HDVersion;
import wallet.core.jni.HDWallet;
import wallet.core.jni.CoinType;
import wallet.core.jni.PublicKey;
import wallet.core.jni.Purpose;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import wallet.core.jni.PrivateKey;

public class BitcoinLegacyCoin extends CoinFactory.Coin {
    private final HDWallet wallet;
    byte[] prefix = new byte[]{(byte) 0x80};
    byte[] testnetPrefix = new byte[]{(byte) 0xef};

    public BitcoinLegacyCoin(String mnemonic) {
        super(mnemonic);
        this.wallet = super.wallet;
    }

    // P2PKH (BIP-44). wallet-core's BITCOINTESTNET derivation is the BIP-84
    // segwit testnet preset (m/84'/1'/0', "tb1q..."), so it must not be used
    // here: on testnet the legacy type needs version byte 0x6f ("m..."/"n...")
    // on the account path m/44'/1'/0'.
    private String buildP2PKHAddress(PublicKey publicKey, Boolean isTestNet) {
        byte prefix = Boolean.TRUE.equals(isTestNet) ? (byte) 0x6f : (byte) 0x00;
        return new BitcoinAddress(publicKey, prefix).description();
    }

    private Derivation derivationFor(Boolean isTestNet) {
        return Boolean.TRUE.equals(isTestNet) ? Derivation.BITCOINTESTNET : Derivation.BITCOINLEGACY;
    }

    private PrivateKey firstReceiveKey(Boolean isTestNet) {
        return wallet.getKey(CoinType.BITCOIN, accountBasePath(isTestNet) + "/0/0");
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        PublicKey publicKey = firstReceiveKey(isTestNet).getPublicKeySecp256k1(true);
        return buildP2PKHAddress(publicKey, isTestNet);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        return Utils.convertPrivateKeytoWIF(firstReceiveKey(isTestNet).data(), isTestNet, prefix, testnetPrefix);
    }

    // The derivation only supplies the coin-type segment (0' / 1'), matching
    // BITCOIN_ADDRESS_TYPES.bitcoin_legacy: xpub on mainnet, tpub on testnet.
    @Override
    public String getExtendedPublicKey(Boolean isTestNet) {
        HDVersion version = Boolean.TRUE.equals(isTestNet) ? HDVersion.TPUB : HDVersion.XPUB;
        return wallet.getExtendedPublicKeyDerivation(Purpose.BIP44, CoinType.BITCOIN, derivationFor(isTestNet), version);
    }

    @Override
    public String getExtendedPrivateKey(Boolean isTestNet) {
        HDVersion version = Boolean.TRUE.equals(isTestNet) ? HDVersion.TPRV : HDVersion.XPRV;
        return wallet.getExtendedPrivateKeyDerivation(Purpose.BIP44, CoinType.BITCOIN, derivationFor(isTestNet), version);
    }

    @Override
    public String signTransaction(String rawData) {
        return null;
    }

    @Override
    public ReadableMap addCustomDerivation(String derivePath, Boolean isTestNet) {
        WritableMap obj = Arguments.createMap();
        PrivateKey tempPrivateKey = wallet.getKey(CoinType.BITCOIN, derivePath);
        PublicKey publicKey = tempPrivateKey.getPublicKeySecp256k1(true);
        String address = buildP2PKHAddress(publicKey, isTestNet);
        String privateKeyString = Utils.convertPrivateKeytoWIF(tempPrivateKey.data(), isTestNet, prefix, testnetPrefix);
        obj.putString("address", address);
        obj.putString("derivePath", derivePath);
        obj.putString("privateKey", privateKeyString);
        return obj;
    }

    @Override
    public String accountBasePath(Boolean isTestNet) {
        return Boolean.TRUE.equals(isTestNet) ? "m/44'/1'/0'" : "m/44'/0'/0'";
    }

    @Override
    public ReadableArray getDeriveAddresses(Boolean isTestNet) {
        // BIP44 standard: 20 external/receive (…/0/i) + 20 internal/change (…/1/i)
        WritableArray result = Arguments.createArray();
        appendDeriveAddressRange(result, 0, 0, 20, isTestNet);
        appendDeriveAddressRange(result, 1, 0, 20, isTestNet);
        return result;
    }
}
