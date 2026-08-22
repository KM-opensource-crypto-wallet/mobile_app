// BitcoinLegacyCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.coinswallet.Utils;

import wallet.core.jni.AnyAddress;
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

    @Override
    public String getNewAddress(Boolean isTestNet) {
        Derivation derivation = isTestNet ? Derivation.BITCOINTESTNET : Derivation.BITCOINLEGACY;
        return wallet.getAddressDerivation(CoinType.BITCOIN, derivation);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        Derivation derivation = isTestNet ? Derivation.BITCOINTESTNET : Derivation.BITCOINLEGACY;
        byte[] privateKeyBytes = wallet.getKeyDerivation(CoinType.BITCOIN, derivation).data();
        return Utils.convertPrivateKeytoWIF(privateKeyBytes, isTestNet, prefix, testnetPrefix);
    }

    @Override
    public String getExtendedPublicKey(Boolean isTestNet) {
        return wallet.getExtendedPublicKey(Purpose.BIP44, CoinType.BITCOIN, HDVersion.XPUB);
    }

    @Override
    public String getExtendedPrivateKey(Boolean isTestNet) {
        return wallet.getExtendedPrivateKey(Purpose.BIP44, CoinType.BITCOIN, HDVersion.XPRV);
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
        String address;
        if (isTestNet) {
            address = new AnyAddress(publicKey, CoinType.BITCOIN, Derivation.BITCOINTESTNET).description();
        } else {
            address = new AnyAddress(publicKey, CoinType.BITCOIN, Derivation.BITCOINLEGACY).description();
        }
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
