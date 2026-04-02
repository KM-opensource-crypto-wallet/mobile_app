// EthereumCoin.java
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

public class EthereumCoin extends CoinFactory.Coin {
    private final String address;
    private final PrivateKey privateKey;

    // static {
    // Log.d("coinswallet", "Registering EthereumCoin");
    // CoinFactory.registerCoin("ethereum", EthereumCoin::new);
    // }

    public EthereumCoin(String mnemonic) {
        super(mnemonic);
        this.address = CoinType.ETHEREUM.deriveAddress(wallet.getKeyForCoin(CoinType.ETHEREUM));
        this.privateKey = wallet.getKeyForCoin(CoinType.ETHEREUM);
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        return this.address;
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        return CoinFactory.Coin.toHex(this.privateKey.data());
    }

    @Override
    public ReadableArray getDeriveAddresses() {
        WritableArray results = Arguments.createArray();
       for(int i=0; i < 50; i++){
           WritableMap obj = Arguments.createMap();
           String derivePath = "m/44'/60'/0'/" + i + "/0";
           PrivateKey tempPrivateKey = wallet.getKey(CoinType.ETHEREUM,derivePath);
           String address = CoinType.ETHEREUM.deriveAddress(tempPrivateKey);
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
        PrivateKey tempPrivateKey = wallet.getKey(CoinType.ETHEREUM,derivePath);
        String address = CoinType.ETHEREUM.deriveAddress(tempPrivateKey);
        String privateKeyString =  CoinFactory.Coin.toHex(tempPrivateKey.data());
        obj.putString("address",address);
        obj.putString("derivePath",derivePath);
        obj.putString("privateKey",privateKeyString);
        return obj;
    }

    @Override
    public String signTransaction(String rawData) {
        return null;
    }
}
