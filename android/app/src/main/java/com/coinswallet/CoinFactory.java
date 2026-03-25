// CoinFactory.java
package com.coinswallet;

import wallet.core.jni.*;
import java.util.*;
import java.util.function.Function;
import java.util.function.Supplier;
import android.util.Log;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

public class CoinFactory {

    // private static final Map<String, Supplier<Coin>> coinMap = new HashMap<>();
    private static final Map<String, Function<String, Coin>> coinMap = new HashMap<>();

    public static void registerCoin(String name, Function<String, Coin> constructor) {
        coinMap.put(name, constructor);
    }

    public static Coin createCoin(String coinName, String mnemonic) {
        Function<String, Coin> constructor = coinMap.get(coinName.toLowerCase());
        if (constructor == null) {
            throw new IllegalArgumentException("Unsupported coin: " + coinName);
        }
        return constructor.apply(mnemonic);
    }

    public static abstract class Coin {
        protected HDWallet wallet;

        protected Coin(String mnemonic) {
            this.wallet = new HDWallet(mnemonic, "");
        }

        public static String toHex(byte[] bytes) {
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02X", b));
            }
            return sb.toString();
        }

        public abstract String getNewAddress(Boolean isTestNet);

        public abstract String getPrivateKey(Boolean isTestNet);
        public String getPublicKeyHex(){
            return null;
        };
        public String getExtendedPublicKey(Boolean isTestNet) {return null; };

        public String getExtendedPrivateKey(Boolean isTestNet) {return null; };

        public ReadableArray getDeriveAddresses(){
            return null;
        };
        public ReadableArray getDeriveAddresses(Boolean isTestNet){
            return getDeriveAddresses();
        };
        public ReadableMap addCustomDerivation(String derivePath, Boolean isTestNet){
            return null;
        };
        public abstract String signTransaction(String rawData);
    }
}
