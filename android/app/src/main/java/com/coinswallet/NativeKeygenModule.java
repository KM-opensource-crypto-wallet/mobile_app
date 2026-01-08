package com.coinswallet;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import java.nio.charset.StandardCharsets;
import java.util.Formatter;

import java.security.SecureRandom;
import wallet.core.jni.HDWallet;
import wallet.core.jni.CoinType;
import wallet.core.jni.PrivateKey;
import wallet.core.jni.Mnemonic;
// import WritableMap
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.coinswallet.coins.*;
import java.util.*;
// import org.walletconnect.*;
// import com.satoshilabs.trezor.lib.protobuf.TrezorType;
// import com.satoshilabs.trezor.lib.protobuf.TrezorMessage;

public class NativeKeygenModule extends ReactContextBaseJavaModule {
  private static ReactApplicationContext reactContext;
  private Map<String, CoinFactory.Coin> coins = new HashMap<>();

  static {
    System.loadLibrary("TrustWalletCore");
    Class<?> ethereumCoinClass = EthereumCoin.class;

  }

  public void loadCoins() {
    Class<?> ethereumCoinClass = EthereumCoin.class;
    CoinFactory.registerCoin("ethereum", EthereumCoin::new);
    CoinFactory.registerCoin("tron", TronCoin::new);
    CoinFactory.registerCoin("bitcoin", BitcoinCoin::new);
    CoinFactory.registerCoin("solana", SolanaCoin::new);
    CoinFactory.registerCoin("litecoin", LiteCoin::new);
    CoinFactory.registerCoin("ripple", RippleCoin::new);
    CoinFactory.registerCoin("thorchain", ThorCoin::new);
    CoinFactory.registerCoin("tezos", TezosCoin::new);
    CoinFactory.registerCoin("cosmos", CosmosCoin::new);
    CoinFactory.registerCoin("polkadot", PolkadotCoin::new);
    CoinFactory.registerCoin("ton", TonCoin::new);
    CoinFactory.registerCoin("dogecoin", DogeCoin::new);
    CoinFactory.registerCoin("aptos", AptosCoin::new);
    CoinFactory.registerCoin("bitcoin_cash", BitcoinCashCoin::new);
    CoinFactory.registerCoin("cardano", CardanoCoin::new);
    CoinFactory.registerCoin("filecoin", FilecoinCoin::new);
    // Add similar lines for other coin classes
  }

  NativeKeygenModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
    loadCoins();
  }

  @Override
  public String getName() {
    return "NativeKeygen";
  }

  private String byteArrayToHex(byte[] bytes) {
    Formatter formatter = new Formatter();
    for (byte b : bytes) {
      formatter.format("%02x", b);
    }
    String hex = formatter.toString();
    formatter.close();
    return hex;
  }

  // ...
  @ReactMethod
  public void generateMnemonic(Promise promise) {
    // Generate a new mnemonic
    try {
      HDWallet wallet = new HDWallet(128, "");
      String mnemonic = wallet.mnemonic();
      promise.resolve(mnemonic);
    } catch (Exception e) {
      Log.e("coinswallet", "in generateMnemonic, exception" + e.toString());
      promise.reject("E_INVALID_MNEMONIC", e);
    }
  }

  @ReactMethod
  public void getWallet(String coinName, String mnemonic,Boolean isTestNet, Promise promise) {
    try {
      CoinFactory.Coin coin;
      coin = coins.get(mnemonic + ":" + coinName); // Check if we already have an instance of this coin
      if (coin == null) {
        coin = CoinFactory.createCoin(coinName, mnemonic);
        coins.put(mnemonic + ":" + coinName, coin); // Store the coin instance
      }
      WritableMap result = Arguments.createMap();
      result.putString("address", coin.getNewAddress(isTestNet));
      result.putString("privateKey", coin.getPrivateKey(isTestNet));
      result.putString("publicKey", coin.getPublicKeyHex());
      result.putString("extendedPublicKey", coin.getExtendedPublicKey(isTestNet));
      result.putString("extendedPrivateKey", coin.getExtendedPrivateKey(isTestNet));
      promise.resolve(result);
    } catch (Exception e) {
      promise.reject("E_INVALID_MNEMONIC", e);
    }
  }

  @ReactMethod
  public void getDeriveAddresses(String coinName, String mnemonic,Boolean isTestNet, Promise promise) {
    try {
      CoinFactory.Coin coin;
      coin = coins.get(mnemonic + ":" + coinName); // Check if we already have an instance of this coin
      if (coin == null) {
        coin = CoinFactory.createCoin(coinName, mnemonic);
        coins.put(mnemonic + ":" + coinName, coin); // Store the coin instance
      }
      WritableMap result = Arguments.createMap();
      result.putArray("deriveAddresses", coin.getDeriveAddresses());
      promise.resolve(result);
    } catch (Exception e) {
      promise.reject("E_INVALID_MNEMONIC", e);
    }
  }
  @ReactMethod
  public void addCustomDerivation(String coinName, String mnemonic,String derivePath, Promise promise) {
    try {
      CoinFactory.Coin coin;
      coin = coins.get(mnemonic + ":" + coinName); // Check if we already have an instance of this coin
      if (coin == null) {
        coin = CoinFactory.createCoin(coinName, mnemonic);
        coins.put(mnemonic + ":" + coinName, coin); // Store the coin instance
      }
      WritableMap result = Arguments.createMap();
      result.putMap("account", coin.addCustomDerivation(derivePath));
      promise.resolve(result);
    } catch (Exception e) {
      promise.reject("E_INVALID_MNEMONIC", e);
    }
  }

  @ReactMethod
  public void generatePrivateKey(Promise promise) {
    try {
      byte[] privateKeyBytes = new byte[32];
      SecureRandom random = new SecureRandom();
      random.nextBytes(privateKeyBytes);
      String privateKeyHex = byteArrayToHex(privateKeyBytes);
      promise.resolve(privateKeyHex);
    } catch (Exception e) {
      promise.reject("ERR_UNEXPECTED_EXCEPTION", e);
    }
  }

  @ReactMethod
  public void generateWallet2(String mnemonic, Promise promise) {
    try {
      // String projectId = ""; // Get Project ID at https://cloud.walletconnect.com/
      // String relayUrl = "relay.walletconnect.com";
      // String serverUrl = "wss://" + relayUrl + "?projectId=" + projectId;

      // List<String> icons = new ArrayList<>();
      // icons.add("https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Icon/Gradient/Icon.png");

      // AppMetaData appMetaData = new AppMetaData(
      // "Kotlin.Responder",
      // "Kotlin AuthSDK Responder Implementation",
      // "kotlin.responder.walletconnect.com",
      // icons,
      // "kotlin-responder-wc:/request");

      // CoreClient.initialize(serverUrl, ConnectionType.AUTOMATIC, this,
      // appMetaData);

      // AuthClient.initialize(new Auth.Params.Init(CoreClient), new
      // AuthClient.Callback() {
      // @Override
      // public void onError(Error error) {
      // Log.e(tag(this), error.getThrowable().getStackTrace().toString());
      // }
      // });

      HDWallet wallet = new HDWallet(mnemonic, "");
      PrivateKey privateKey = wallet.getKeyForCoin(CoinType.ETHEREUM);

      String address = CoinType.ETHEREUM.deriveAddress(privateKey);
      promise.resolve(address);
    } catch (Exception e) {
      promise.reject("E_INVALID_MNEMONIC", e);
    }
  }

  // @ReactMethod
  // public void generateWalletFromPhrase(String phrase, Promise promise) {
  // try {
  // // Generate a seed from the mnemonic phrase
  // byte[] seed = TrezorType.HDNodeType.newBuilder()
  // .setDepth(0)
  // .setFingerprint(0)
  // .setChildNum(0)
  // .setChainCode(ByteString.copyFrom(new byte[32]))
  // .setPrivateKey(ByteString.copyFrom(new byte[32]))
  // .build()
  // .toByteArray();

  // // Derive the private key for the Ethereum wallet
  // // (m/44'/60'/0'/0/0 according to BIP44)
  // TrezorMessage.HDNodePathType path = TrezorMessage.HDNodePathType.newBuilder()
  // .addAllAddressN(Arrays.asList(44 | 0x80000000, 60 | 0x80000000, 0 |
  // 0x80000000, 0, 0))
  // .setNode(TrezorType.HDNodeType.parseFrom(seed))
  // .build();
  // TrezorType.HDNodeType walletNode = TrezorType.HDNodeType
  // .parseFrom(TrezorCrypto.hmacSha512(path.toByteArray(), phrase.getBytes()));

  // // Convert the private key to hexadecimal
  // byte[] privateKeyBytes = walletNode.getPrivateKey().toByteArray();
  // String privateKeyHex = byteArrayToHex(privateKeyBytes);

  // promise.resolve(privateKeyHex);
  // } catch (Exception e) {
  // promise.reject("ERR_UNEXPECTED_EXCEPTION", e);
  // }
  // }
}
