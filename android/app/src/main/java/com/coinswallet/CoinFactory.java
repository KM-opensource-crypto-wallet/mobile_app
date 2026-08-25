// CoinFactory.java
package com.coinswallet;

import wallet.core.jni.*;
import java.util.*;
import java.util.function.Function;
import java.util.function.Supplier;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;

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
        // Mirrors RECEIVE_CHAIN / CHANGE_CHAIN / MAX_ADDRESSES_PER_CHAIN in
        // dok-wallet-blockchain-networks/service/bitcoinHdAddress.js.
        protected static final int RECEIVE_CHAIN = 0;
        protected static final int CHANGE_CHAIN = 1;
        protected static final int MAX_DERIVE_RANGE_COUNT = 500;

        // BIP44 account base path, e.g. "m/84'/0'/0'". The coin-type segment
        // differs per network (0' mainnet, 1' testnet), so overrides receive
        // isTestNet; this must stay in step with getAccountBasePath in
        // dok-wallet-blockchain-networks/service/bitcoinHdAddress.js. Coins that
        // support ranged derivation override this; others keep the empty default.
        public String accountBasePath(Boolean isTestNet) {
            return "";
        }
        // Appends `count` addresses of one BIP44 chain (0 = receive,
        // 1 = change) starting at `startIndex`, reusing each coin's
        // addCustomDerivation so the address type stays coin-specific.
        //
        // Every step is a full BIP32 derivation, and this is reachable from JS
        // through the getDeriveAddressRange @ReactMethod, so the range is
        // bounded: an unbounded count would block the bridge thread and
        // exhaust memory. BIP44 defines exactly two chains, and the per-chain
        // cap matches MAX_ADDRESSES_PER_CHAIN in bitcoinHdAddress.js. Invalid
        // input yields no addresses, as before.
        protected void appendDeriveAddressRange(WritableArray target, int chainIndex, int startIndex, int count, Boolean isTestNet) {
            String basePath = accountBasePath(isTestNet);
            if (basePath.isEmpty()
                    || count <= 0
                    || count > MAX_DERIVE_RANGE_COUNT
                    || startIndex < 0
                    || (chainIndex != RECEIVE_CHAIN && chainIndex != CHANGE_CHAIN)
                    || startIndex > Integer.MAX_VALUE - count) {
                return;
            }
            for (int i = startIndex; i < startIndex + count; i++) {
                target.pushMap(addCustomDerivation(basePath + "/" + chainIndex + "/" + i, isTestNet));
            }
        }
        public ReadableArray getDeriveAddressRange(int chainIndex, int startIndex, int count, Boolean isTestNet) {
            WritableArray result = Arguments.createArray();
            appendDeriveAddressRange(result, chainIndex, startIndex, count, isTestNet);
            return result;
        }
        public abstract String signTransaction(String rawData);
    }
}
