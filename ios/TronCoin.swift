//
//  TronCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class TronCoin: CoinFactory.Coin {
    private var addressIndex: Int = 0
    
    override init(mnemonic: String) {
        super.init(mnemonic: mnemonic)
    }
    
    override func getNewAddress(isTestNet:Bool) -> String {
        let privateKey = wallet.getKeyForCoin(coin: .tron)
        let address = CoinType.tron.deriveAddress(privateKey: privateKey)
        addressIndex += 1
        return address
    }
    
    override func getPrivateKey(isTestNet:Bool) -> String {
        let privateKeyBytes = wallet.getKeyForCoin(coin: .tron).data
        return privateKeyBytes.map { String(format: "%02x", $0) }.joined()
    }
  
  override func getDeriveAddresses() -> NSMutableArray {
    let result: NSMutableArray = []
    for i in 0..<50 {
          let derivePath = String(format: "m/44'/195'/0'/%@/0", String(i))
          let privateKey = wallet.getKey(coin: .tron, derivationPath: derivePath)
          let address = CoinType.tron.deriveAddress(privateKey: privateKey)
          let yourAuxDic: NSMutableDictionary = [:]
          yourAuxDic["derivePath"] = derivePath
          yourAuxDic["privateKey"] = privateKey.data.hexString
          yourAuxDic["address"] = address
          result.add(yourAuxDic)
      }
      return result;
    }
  
  override func addCustomDerivation(derivePath:String) -> NSMutableDictionary {
      let privateKey = wallet.getKey(coin: .tron, derivationPath: derivePath)
      let address = CoinType.tron.deriveAddress(privateKey: privateKey)
      let yourAuxDic: NSMutableDictionary = [:]
      yourAuxDic["derivePath"] = derivePath
      yourAuxDic["privateKey"] = privateKey.data.hexString
      yourAuxDic["address"] = address
      return yourAuxDic;
  }

    
    override func signTransaction(rawData: String) -> String {
        // Implement the logic to sign a Tron transaction using the provided raw data
        return ""
    }
}
