//
//  EthereumCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class CosmosCoin: CoinFactory.Coin {
  private var address: String = ""
  private var privateKey: String = ""
  
  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
    let privateKeyInfo = wallet.getKeyForCoin(coin: .cosmos)
    self.address = CoinType.cosmos.deriveAddress(privateKey: privateKeyInfo)
    self.privateKey = privateKeyInfo.data.hexString;
  }
  
  override func getNewAddress(isTestNet:Bool) -> String {
    return self.address
  }
  
  override func getPrivateKey(isTestNet:Bool) -> String {
    return self.privateKey;
  }
  
  override func signTransaction(rawData: String) -> String {
    // Implement the logic to sign an Ethereum transaction using the provided raw data
    return ""
  }
}
