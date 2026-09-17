//
//  TronCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class RippleCoin: CoinFactory.Coin {
  private var addressIndex: Int = 0
  private var privateKey: PrivateKey?

  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
    privateKey = wallet.getKeyForCoin(coin: .xrp)
  }

  override func getNewAddress(isTestNet:Bool) -> String {
    let address = wallet.getAddressForCoin(coin: .xrp)
    return address
  }
  
  func getOrCreatePrivateKey() -> PrivateKey {
    if(privateKey != nil){
      return privateKey!;
    }
    return privateKey!;
  }
  
  override func getPublicKeyHash() -> String {
    let privateKeyData = getOrCreatePrivateKey()
    let publicKeyData = privateKeyData.getPublicKey(coinType: .xrp).data
    return publicKeyData.hexString;
  }

  override func getPrivateKey(isTestNet:Bool) -> String {
    let privateKeyData = getOrCreatePrivateKey()
    return privateKeyData.data.hexString
  }

  override func signTransaction(rawData: String) -> String {
    // Implement the logic to sign a Tron transaction using the provided raw data
    return ""
  }
}
