import Foundation
import WalletCore

class BitcoinSegwitCoin: CoinFactory.Coin {

  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }

  private func buildP2SHP2WPKHAddress(publicKey: PublicKey, isTestNet: Bool) -> String {
    let pubKeyHash = Hash.sha256RIPEMD(data: publicKey.data)
    let redeemScript = Data([0x00, 0x14]) + pubKeyHash
    let scriptHash = Hash.sha256RIPEMD(data: redeemScript)
    let prefix: UInt8 = isTestNet ? 0xC4 : 0x05
    let payload = Data([prefix]) + scriptHash
    return Base58.encode(data: payload)
  }

  override func getNewAddress(isTestNet: Bool) -> String {
    let privateKey = wallet.getKey(coin: .bitcoin, derivationPath: "m/49'/0'/0'/0/0")
    let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
    return buildP2SHP2WPKHAddress(publicKey: publicKey, isTestNet: isTestNet)
  }

  override func getPrivateKey(isTestNet: Bool) -> String {
    let privateKey = wallet.getKey(coin: .bitcoin, derivationPath: "m/49'/0'/0'/0/0")
    return Utils.convertToWif(data: privateKey.data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
  }

  override func getExtendedPublicKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPublicKey(purpose: .bip49, coin: .bitcoin, version: .ypub)
  }

  override func getExtendedPrivateKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPrivateKey(purpose: .bip49, coin: .bitcoin, version: .yprv)
  }

  override func signTransaction(rawData: String) -> String {
    return ""
  }

  override func addCustomDerivation(derivePath: String, isTestNet: Bool) -> NSMutableDictionary {
    let privateKey = wallet.getKey(coin: .bitcoin, derivationPath: derivePath)
    let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
    let address = buildP2SHP2WPKHAddress(publicKey: publicKey, isTestNet: isTestNet)
    let dict: NSMutableDictionary = [:]
    dict["derivePath"] = derivePath
    dict["privateKey"] = Utils.convertToWif(data: privateKey.data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
    dict["address"] = address
    return dict
  }

  override func accountBasePath() -> String {
    return "m/49'/0'/0'"
  }

  override func getDeriveAddresses(isTestNet: Bool) -> NSMutableArray {
    // BIP49 standard: 20 external/receive (…/0/i) + 20 internal/change (…/1/i)
    let result = NSMutableArray()
    result.addObjects(from: getDeriveAddressRange(chainIndex: 0, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    result.addObjects(from: getDeriveAddressRange(chainIndex: 1, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    return result
  }
}
