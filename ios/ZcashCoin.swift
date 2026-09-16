//
//  ZcashCoin.swift
//  coinswallet
//

import Foundation
import WalletCore

class ZcashCoin: CoinFactory.Coin {
  
  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }

  override func accountBasePath(isTestNet: Bool) -> String {
    return isTestNet ? "m/44'/1'/0'" : "m/44'/133'/0'"
  }

  private func zcashKey(derivePath: String) -> PrivateKey {
    return wallet.getKey(coin: .zcash, derivationPath: derivePath)!
  }

  private func zcashAddress(privateKey: PrivateKey, isTestNet: Bool) -> String {
    if !isTestNet {
      return CoinType.zcash.deriveAddress(privateKey: privateKey)
    }
    let publicKey = privateKey.getPublicKey(coinType: .zcash)
    let pubkeyHash = Hash.sha256RIPEMD(data: publicKey.data)
    // Testnet transparent P2PKH prefix: tm... = 0x1D25.
    return Utils.encodeBase58CheckAddress(prefix: [0x1d, 0x25], payload: pubkeyHash)
  }

  override func getNewAddress(isTestNet: Bool) -> String {
    let privateKey = zcashKey(derivePath: accountBasePath(isTestNet: isTestNet) + "/0/0")
    return zcashAddress(privateKey: privateKey, isTestNet: isTestNet)
  }

  override func getPrivateKey(isTestNet: Bool) -> String {
    let privateKeyBytes = zcashKey(derivePath: accountBasePath(isTestNet: isTestNet) + "/0/0").data
    return Utils.convertToWif(data: privateKeyBytes, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
  }

  override func addCustomDerivation(derivePath: String, isTestNet: Bool) -> NSMutableDictionary {
    let privateKey = zcashKey(derivePath: derivePath)
    let dict: NSMutableDictionary = [:]
    dict["derivePath"] = derivePath
    dict["privateKey"] = Utils.convertToWif(data: privateKey.data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
    dict["address"] = zcashAddress(privateKey: privateKey, isTestNet: isTestNet)
    return dict
  }

  override func getDeriveAddresses(isTestNet: Bool) -> NSMutableArray {
    let result = NSMutableArray()
    result.addObjects(from: getDeriveAddressRange(chainIndex: 0, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    result.addObjects(from: getDeriveAddressRange(chainIndex: 1, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    return result
  }

  override func signTransaction(rawData: String) -> String {
    return ""
  }
}
