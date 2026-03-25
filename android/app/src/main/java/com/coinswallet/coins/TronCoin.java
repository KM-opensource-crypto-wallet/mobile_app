// TronCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import wallet.core.jni.HDWallet;
import wallet.core.jni.CoinType;
import wallet.core.jni.PrivateKey;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import android.util.Log;

public class TronCoin extends CoinFactory.Coin {
    private final String address;

    public TronCoin(String mnemonic) {
        super(mnemonic);
        this.address = CoinType.TRON.deriveAddress(wallet.getKeyForCoin(CoinType.TRON));
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        return this.address;
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        byte[] privateKeyBytes = wallet.getKeyForCoin(CoinType.TRON).data();
        String hexPrivateKey = CoinFactory.Coin.toHex(privateKeyBytes);
        System.out.println("hexPrivateKey: " + hexPrivateKey);
        return hexPrivateKey;
        // return new String(privateKeyBytes, StandardCharsets.UTF_8);
    }

    public ReadableArray getDeriveAddresses() {
        WritableArray results = Arguments.createArray();
        for(int i=0; i < 50; i++){
            WritableMap obj = Arguments.createMap();
            String derivePath = "m/44'/195'/0'/" + i + "/0";
            PrivateKey tempPrivateKey = wallet.getKey(CoinType.TRON,derivePath);
            String address = CoinType.TRON.deriveAddress(tempPrivateKey);
            String privateKeyString =  CoinFactory.Coin.toHex(tempPrivateKey.data());
            obj.putString("address",address);
            obj.putString("derivePath",derivePath);
            obj.putString("privateKey",privateKeyString);
            results.pushMap(obj);
        }
        return results;
    }

    @Override
    public ReadableMap addCustomDerivation(String derivePath, Boolean isTestNet) {
        WritableMap obj = Arguments.createMap();
        PrivateKey tempPrivateKey = wallet.getKey(CoinType.TRON,derivePath);
        String address = CoinType.TRON.deriveAddress(tempPrivateKey);
        String privateKeyString =  CoinFactory.Coin.toHex(tempPrivateKey.data());
        obj.putString("address",address);
        obj.putString("derivePath",derivePath);
        obj.putString("privateKey",privateKeyString);
        return obj;
    }

    @Override
    public String signTransaction(String rawData) {
        // You need to implement this method according to the specific requirements of
        // Tron transactions.
        return null;
    }
}
