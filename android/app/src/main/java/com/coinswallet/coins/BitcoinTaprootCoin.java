// BitcoinTaprootCoin.java
package com.coinswallet.coins;

import com.coinswallet.CoinFactory;
import com.coinswallet.Utils;

import wallet.core.jni.AnyAddress;
import wallet.core.jni.Bech32;
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

// BIP-86 key-path taproot (P2TR, bech32m `bc1p…`). Mirrors
// BITCOIN_ADDRESS_TYPES.bitcoin_taproot in
// dok-wallet-blockchain-networks/service/bitcoinHdAddress.js: purpose 86',
// plain xpub/xprv (tpub/tprv on testnet), WIF holds the untweaked key.
public class BitcoinTaprootCoin extends CoinFactory.Coin {
    private final HDWallet wallet;
    byte[] prefix = new byte[]{(byte) 0x80};
    byte[] testnetPrefix = new byte[]{(byte) 0xef};

    public BitcoinTaprootCoin(String mnemonic) {
        super(mnemonic);
        this.wallet = super.wallet;
    }

    private Derivation derivationFor(Boolean isTestNet) {
        return Boolean.TRUE.equals(isTestNet) ? Derivation.BITCOINTESTNET : Derivation.BITCOINTAPROOT;
    }

    // wallet-core tweaks the key (BIP-341) and bech32m-encodes it for mainnet
    // only. For testnet we re-encode the same witness program under the `tb`
    // hrp: TWBech32 decodeM/encodeM convert the whole 5-bit symbol stream to
    // bytes and back, which is lossless for a v1 program (1 version symbol +
    // 52 program symbols = 265 bits = 33 bytes + one zero pad bit), so this
    // is a pure hrp/checksum swap.
    private String buildTaprootAddress(PublicKey publicKey, Boolean isTestNet) {
        String mainnetAddress = new AnyAddress(publicKey, CoinType.BITCOIN, Derivation.BITCOINTAPROOT).description();
        if (!Boolean.TRUE.equals(isTestNet)) {
            return mainnetAddress;
        }
        return Bech32.encodeM("tb", Bech32.decodeM(mainnetAddress));
    }

    private PrivateKey firstReceiveKey(Boolean isTestNet) {
        return wallet.getKey(CoinType.BITCOIN, accountBasePath(isTestNet) + "/0/0");
    }

    @Override
    public String getNewAddress(Boolean isTestNet) {
        PublicKey publicKey = firstReceiveKey(isTestNet).getPublicKeySecp256k1(true);
        return buildTaprootAddress(publicKey, isTestNet);
    }

    @Override
    public String getPrivateKey(Boolean isTestNet) {
        return Utils.convertPrivateKeytoWIF(firstReceiveKey(isTestNet).data(), isTestNet, prefix, testnetPrefix);
    }

    @Override
    public String getExtendedPublicKey(Boolean isTestNet) {
        HDVersion version = Boolean.TRUE.equals(isTestNet) ? HDVersion.TPUB : HDVersion.XPUB;
        return wallet.getExtendedPublicKeyDerivation(Purpose.BIP86, CoinType.BITCOIN, derivationFor(isTestNet), version);
    }

    @Override
    public String getExtendedPrivateKey(Boolean isTestNet) {
        HDVersion version = Boolean.TRUE.equals(isTestNet) ? HDVersion.TPRV : HDVersion.XPRV;
        return wallet.getExtendedPrivateKeyDerivation(Purpose.BIP86, CoinType.BITCOIN, derivationFor(isTestNet), version);
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
        String address = buildTaprootAddress(publicKey, isTestNet);
        String privateKeyString = Utils.convertPrivateKeytoWIF(tempPrivateKey.data(), isTestNet, prefix, testnetPrefix);
        obj.putString("address", address);
        obj.putString("derivePath", derivePath);
        obj.putString("privateKey", privateKeyString);
        return obj;
    }

    @Override
    public String accountBasePath(Boolean isTestNet) {
        return Boolean.TRUE.equals(isTestNet) ? "m/86'/1'/0'" : "m/86'/0'/0'";
    }

    @Override
    public ReadableArray getDeriveAddresses(Boolean isTestNet) {
        // BIP86 standard: 20 external/receive (…/0/i) + 20 internal/change (…/1/i)
        WritableArray result = Arguments.createArray();
        appendDeriveAddressRange(result, 0, 0, 20, isTestNet);
        appendDeriveAddressRange(result, 1, 0, 20, isTestNet);
        return result;
    }
}
