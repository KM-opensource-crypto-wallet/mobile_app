//
//  FileCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class FilecoinCoin: CoinFactory.Coin {
  private var address: String = ""
  private var privateKey: String = ""

  private let defaultHDPath = "m/44\'/461\'/0\'/0/0"
  private let testDefaultHDPath = "m/44\'/1\'/0\'/0/0"

  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }

  override func getNewAddress(isTestNet: Bool) -> String {
    let path = isTestNet ? testDefaultHDPath : defaultHDPath
    let privateKey = wallet.getKey(coin: .filecoin, derivationPath: path)
    let address = CoinType.filecoin.deriveAddress(privateKey: privateKey)
    if (isTestNet) {
      var modified = address
      modified.replaceSubrange(modified.startIndex...modified.startIndex, with: "t")
      return modified
    }
    return address
  }

  override func getPrivateKey(isTestNet: Bool) -> String {
    let path = isTestNet ? testDefaultHDPath : defaultHDPath
    let privateKey = wallet.getKey(coin: .filecoin, derivationPath: path)
    return privateKey.data.hexString
  }

  override func signTransaction(rawData: String) -> String {
    // Implement the logic to sign an Ethereum transaction using the provided raw data
    return ""
  }
}
