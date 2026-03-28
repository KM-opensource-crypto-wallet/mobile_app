// BitcoinSegwitCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.coinswallet.Utils;

import wallet.core.jni.Base58;
import wallet.core.jni.Hash;
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

public class BitcoinSegwitCoin extends CoinFactory.Coin {
    private final HDWallet wallet;
    byte[] prefix = new byte[]{(byte) 0x80};
    byte[] testnetPrefix = new byte[]{(byte) 0xef};

    public BitcoinSegwitCoin(String mnemonic) {
        super(mnemonic);
        this.wallet = super.wallet;
    }

    private String buildP2SHP2WPKHAddress(PublicKey publicKey, Boolean isTestNet) {
        byte[] pubKeyHash = Hash.sha256RIPEMD(publicKey.data());
        byte[] redeemScript = new byte[22];
        redeemScript[0] = 0x00; // OP_0
        redeemScript[1] = 0x14; // PUSH 20 bytes
        System.arraycopy(pubKeyHash, 0, redeemScript, 2, 20);
        byte[] scriptHash = Hash.sha256RIPEMD(redeemScript);
        byte[] payload = new byte[21];
        payload[0] = isTestNet ? (byte) 0xC4 : (byte) 0x05;
        System.arraycopy(scriptHash, 0, payload, 1, 20);
        return Base58.encode(payload);
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        PrivateKey privateKey = wallet.getKey(CoinType.BITCOIN, "m/49'/0'/0'/0/0");
        PublicKey publicKey = privateKey.getPublicKeySecp256k1(true);
        return buildP2SHP2WPKHAddress(publicKey, isTestNet);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        byte[] privateKeyBytes = wallet.getKey(CoinType.BITCOIN, "m/49'/0'/0'/0/0").data();
        return Utils.convertPrivateKeytoWIF(privateKeyBytes, isTestNet, prefix, testnetPrefix);
    }

    @Override
    public String getExtendedPublicKey(Boolean isTestNet) {
        return wallet.getExtendedPublicKey(Purpose.BIP49, CoinType.BITCOIN, HDVersion.YPUB);
    }

    @Override
    public String getExtendedPrivateKey(Boolean isTestNet) {
        return wallet.getExtendedPrivateKey(Purpose.BIP49, CoinType.BITCOIN, HDVersion.YPRV);
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
        String address = buildP2SHP2WPKHAddress(publicKey, isTestNet);
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
            String derivePath = "m/49'/0'/0'/" + i + "/0";
            PrivateKey tempPrivateKey = wallet.getKey(CoinType.BITCOIN, derivePath);
            PublicKey publicKey = tempPrivateKey.getPublicKeySecp256k1(true);
            String address = buildP2SHP2WPKHAddress(publicKey, isTestNet);
            WritableMap obj = Arguments.createMap();
            obj.putString("derivePath", derivePath);
            obj.putString("privateKey", Utils.convertPrivateKeytoWIF(tempPrivateKey.data(), isTestNet, prefix, testnetPrefix));
            obj.putString("address", address);
            result.pushMap(obj);
        }
        return result;
    }
}
