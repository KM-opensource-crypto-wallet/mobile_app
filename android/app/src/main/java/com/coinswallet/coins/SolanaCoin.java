// EthereumCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import wallet.core.jni.Base58;
import wallet.core.jni.CoinType;
import wallet.core.jni.Derivation;
import wallet.core.jni.PrivateKey;

public class SolanaCoin extends CoinFactory.Coin {

    // static {
    // Log.d("coinswallet", "Registering EthereumCoin");
    // CoinFactory.registerCoin("ethereum", EthereumCoin::new);
    // }

    public SolanaCoin(String mnemonic) {
        super(mnemonic);
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        return wallet.getAddressDerivation(CoinType.SOLANA, Derivation.SOLANASOLANA);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        PrivateKey privateKey = wallet.getKeyDerivation(CoinType.SOLANA,Derivation.SOLANASOLANA);
        return privateKeyToString(privateKey);
    }

    @Override
    public ReadableArray getDeriveAddresses() {
        WritableArray results = Arguments.createArray();
        String firtPrivateKeyString = getPrivateKey(false);
        String firstAddress =  getNewAddress(false);
        WritableMap firstObj = Arguments.createMap();
        firstObj.putString("address",firstAddress);
        firstObj.putString("derivePath","m/44'/501'/0'/0'");
        firstObj.putString("privateKey",firtPrivateKeyString);
        results.pushMap(firstObj);
        for(int i=0; i < 50; i++){
            WritableMap obj = Arguments.createMap();
            String derivePath = "m/44'/501'/" + i + "'";
            PrivateKey tempPrivateKey = wallet.getKey(CoinType.SOLANA,derivePath);
            String address = CoinType.SOLANA.deriveAddress(tempPrivateKey);
            String privateKeyString =  privateKeyToString(tempPrivateKey);;
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
        PrivateKey tempPrivateKey = wallet.getKey(CoinType.SOLANA,derivePath);
        String address = CoinType.SOLANA.deriveAddress(tempPrivateKey);
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

    private String privateKeyToString(PrivateKey privateKey){
        byte[] privateKeyData = privateKey.data();
        byte[] publicKeyData = privateKey.getPublicKeyEd25519().data();
        byte[] finalBytes = concateByteArray(privateKeyData,publicKeyData);
        return Base58.encodeNoCheck(finalBytes);
    }
    private byte[] concateByteArray(byte[] firstarray, byte[] secondarray) {
        byte[] output = new byte[firstarray.length + secondarray.length];
        int i;
        for (i = 0; i < firstarray.length; i++) {
            output[i] = firstarray[i];
        }
        int index = i;
        for (i = 0; i < secondarray.length; i++) {
            output[index] = secondarray[i];
            index++;
        }
        return output;
    }
}

