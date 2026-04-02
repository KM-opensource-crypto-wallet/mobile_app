import Foundation
import WalletCore

class BitcoinLegacyCoin: CoinFactory.Coin {

  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }

  override func getNewAddress(isTestNet: Bool) -> String {
    let derivation: Derivation = isTestNet ? .bitcoinTestnet : .bitcoinLegacy
    return wallet.getAddressDerivation(coin: .bitcoin, derivation: derivation)
  }

  override func getPrivateKey(isTestNet: Bool) -> String {
    let derivation: Derivation = isTestNet ? .bitcoinTestnet : .bitcoinLegacy
    let privateKeyBytes = wallet.getKeyDerivation(coin: .bitcoin, derivation: derivation).data
    return Utils.convertToWif(data: privateKeyBytes, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
  }

  override func getExtendedPublicKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPublicKey(purpose: .bip44, coin: .bitcoin, version: .xpub)
  }

  override func getExtendedPrivateKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPrivateKey(purpose: .bip44, coin: .bitcoin, version: .xprv)
  }

  override func signTransaction(rawData: String) -> String {
    return ""
  }

  override func addCustomDerivation(derivePath: String, isTestNet: Bool) -> NSMutableDictionary {
    let privateKey = wallet.getKey(coin: .bitcoin, derivationPath: derivePath)
    let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
    let address: String
    if isTestNet {
      address = AnyAddress(publicKey: publicKey, coin: .bitcoin, derivation: .bitcoinTestnet).description
    } else {
      address = AnyAddress(publicKey: publicKey, coin: .bitcoin, derivation: .bitcoinLegacy).description
    }
    let dict: NSMutableDictionary = [:]
    dict["derivePath"] = derivePath
    dict["privateKey"] = Utils.convertToWif(data: privateKey.data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
    dict["address"] = address
    return dict
  }

  override func getDeriveAddresses(isTestNet: Bool) -> NSMutableArray {
    let result = NSMutableArray()
    for i in 0..<20 {
      let derivePath = "m/44'/0'/0'/\(i)/0"
      let privateKey = wallet.getKey(coin: .bitcoin, derivationPath: derivePath)
      let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
      let address: String
      if isTestNet {
        address = AnyAddress(publicKey: publicKey, coin: .bitcoin, derivation: .bitcoinTestnet).description
      } else {
        address = AnyAddress(publicKey: publicKey, coin: .bitcoin, derivation: .bitcoinLegacy).description
      }
      let dict: NSMutableDictionary = [:]
      dict["derivePath"] = derivePath
      dict["privateKey"] = Utils.convertToWif(data: privateKey.data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
      dict["address"] = address
      result.add(dict)
    }
    return result
  }
}
