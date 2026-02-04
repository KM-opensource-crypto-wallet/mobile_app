// BitcoinCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.coinswallet.Utils;


import wallet.core.jni.Derivation;
import wallet.core.jni.HDVersion;
import wallet.core.jni.HDWallet;
import wallet.core.jni.CoinType;
import wallet.core.jni.Purpose;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import wallet.core.jni.PrivateKey;

public class BitcoinCoin extends CoinFactory.Coin {
    private final HDWallet wallet;

    public BitcoinCoin(String mnemonic) {
        super(mnemonic);
        this.wallet = super.wallet;
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        // Derive a new private key for each call
        Derivation derivation = Derivation.BITCOINSEGWIT;
        if (isTestNet) {
            derivation = Derivation.BITCOINTESTNET;
        }
        return wallet.getAddressDerivation(CoinType.BITCOIN, derivation);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        Derivation derivation = Derivation.BITCOINSEGWIT;
        if (isTestNet) {
            derivation = Derivation.BITCOINTESTNET;
        }
        byte[] privateKeyBytes = wallet.getKeyDerivation(CoinType.BITCOIN,derivation).data();
        byte[] prefix = new byte[]{(byte) 0x80};
        byte[] testnetPrefix = new byte[]{(byte) 0xef};
        return Utils.convertPrivateKeytoWIF(privateKeyBytes,isTestNet,prefix,testnetPrefix);
    }

    @Override
    public String getExtendedPublicKey(Boolean isTestNet) {
        Derivation derivation = Derivation.BITCOINSEGWIT;
        HDVersion version = HDVersion.ZPUB;
        if(isTestNet){
            derivation =  Derivation.BITCOINTESTNET;
        }
        return wallet.getExtendedPublicKeyDerivation(Purpose.BIP84,CoinType.BITCOIN,derivation,version);
    }

    @Override
    public String getExtendedPrivateKey(Boolean isTestNet) {
        Derivation derivation = Derivation.BITCOINSEGWIT;
        HDVersion version = HDVersion.ZPRV;
        if(isTestNet){
            derivation =  Derivation.BITCOINTESTNET;
        }
        return wallet.getExtendedPrivateKeyDerivation(Purpose.BIP84,CoinType.BITCOIN,derivation,version);
    }


    @Override
    public String signTransaction(String rawData) {
        // You need to implement this method according to the specific requirements of
        // Bitcoin transactions.
        return null;
    }

    @Override
    public ReadableMap addCustomDerivation(String derivePath) {
        WritableMap obj = Arguments.createMap();
        PrivateKey tempPrivateKey = wallet.getKey(CoinType.BITCOIN,derivePath);
        String address = CoinType.BITCOIN.deriveAddress(tempPrivateKey);
        String privateKeyString =  CoinFactory.Coin.toHex(tempPrivateKey.data());
        obj.putString("address",address);
        obj.putString("derivePath",derivePath);
        obj.putString("privateKey",privateKeyString);
        return obj;
    }
}
