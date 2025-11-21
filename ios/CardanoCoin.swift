//
//  CardanoCoin.swift
//  coinswallet
//
//  Created by Jems5767 on 17/04/2025.
//


import Foundation
import WalletCore

class CardanoCoin: CoinFactory.Coin {
  private var address: String = ""
  
  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
    let privateKeyInfo = wallet.getKeyForCoin(coin: .cardano)
    self.address = CoinType.cardano.deriveAddress(privateKey: privateKeyInfo)
  }
  
  override func getNewAddress(isTestNet:Bool) -> String {
    return self.address
  }
  
  override func getPrivateKey(isTestNet:Bool) -> String {
     return "";
  }
  
  override func signTransaction(rawData: String) -> String {
    // Implement the logic to sign an Ethereum transaction using the provided raw data
    return ""
  }
}
