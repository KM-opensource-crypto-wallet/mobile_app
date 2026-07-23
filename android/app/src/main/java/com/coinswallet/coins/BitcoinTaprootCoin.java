// BitcoinTaprootCoin.java
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

public class BitcoinTaprootCoin extends CoinFactory.Coin {
    private final HDWallet wallet;
    byte[] prefix = new byte[]{(byte) 0x80};
    byte[] testnetPrefix = new byte[]{(byte) 0xef};

    public BitcoinTaprootCoin(String mnemonic) {
        super(mnemonic);
        this.wallet = super.wallet;
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        Derivation derivation = isTestNet ? Derivation.BITCOINTESTNET : Derivation.BITCOINTAPROOT;
        return wallet.getAddressDerivation(CoinType.BITCOIN, derivation);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        Derivation derivation = isTestNet ? Derivation.BITCOINTESTNET : Derivation.BITCOINTAPROOT;
        byte[] privateKeyBytes = wallet.getKeyDerivation(CoinType.BITCOIN, derivation).data();
        return Utils.convertPrivateKeytoWIF(privateKeyBytes, isTestNet, prefix, testnetPrefix);
    }

    @Override
    public String getExtendedPublicKey(Boolean isTestNet) {
        return wallet.getExtendedPublicKey(Purpose.BIP86, CoinType.BITCOIN, HDVersion.XPUB);
    }

    @Override
    public String getExtendedPrivateKey(Boolean isTestNet) {
        return wallet.getExtendedPrivateKey(Purpose.BIP86, CoinType.BITCOIN, HDVersion.XPRV);
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
            address = new AnyAddress(publicKey, CoinType.BITCOIN, Derivation.BITCOINTAPROOT).description();
        }
        String privateKeyString = Utils.convertPrivateKeytoWIF(tempPrivateKey.data(), isTestNet, prefix, testnetPrefix);
        obj.putString("address", address);
        obj.putString("derivePath", derivePath);
        obj.putString("privateKey", privateKeyString);
        return obj;
    }

    @Override
    public ReadableArray getDeriveAddresses(Boolean isTestNet) {
        WritableArray result = Arguments.createArray();
        for (int i = 0; i < 20; i++) {
            String derivePath = "m/86'/0'/0'/" + i + "/0";
            PrivateKey tempPrivateKey = wallet.getKey(CoinType.BITCOIN, derivePath);
            PublicKey publicKey = tempPrivateKey.getPublicKeySecp256k1(true);
            String address;
            if (isTestNet) {
                address = new AnyAddress(publicKey, CoinType.BITCOIN, Derivation.BITCOINTESTNET).description();
            } else {
                address = new AnyAddress(publicKey, CoinType.BITCOIN, Derivation.BITCOINTAPROOT).description();
            }
            WritableMap obj = Arguments.createMap();
            obj.putString("derivePath", derivePath);
            obj.putString("privateKey", Utils.convertPrivateKeytoWIF(tempPrivateKey.data(), isTestNet, prefix, testnetPrefix));
            obj.putString("address", address);
            result.pushMap(obj);
        }
        return result;
    }
}
