//
//  BitcoinCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//


import Foundation
import WalletCore

class BitcoinCashCoin: CoinFactory.Coin {
  
  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }
  
  override func getNewAddress(isTestNet:Bool) -> String {
    let address  = wallet.getAddressForCoin(coin: .bitcoinCash)
    return address.replacingOccurrences(of: "bitcoincash:", with: "")
  }
  


  override func getPrivateKey(isTestNet:Bool) -> String {
    let privateKeyBytes = wallet.getKeyForCoin(coin: .bitcoinCash).data
    return Utils.convertToWif(data: privateKeyBytes, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
  }
  
  override func signTransaction(rawData: String) -> String {
    // Implement the logic to sign a Bitcoin transaction using the provided raw data
    return ""
  }
}
