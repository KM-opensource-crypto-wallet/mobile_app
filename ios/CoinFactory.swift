//
//  CoinFactory.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class CoinFactory {
  private static var coinMap = [String: (String) -> Coin]()
  
  static func registerCoin(name: String, constructor: @escaping (String) -> Coin) {
    coinMap[name] = constructor
  }
  
  static func createCoin(coinName: String, mnemonic: String) -> Coin {
    guard let constructor = coinMap[coinName.lowercased()] else {
      print("in create coin unsupported", coinName)
      fatalError("Unsupported coin: \(coinName)")
    }
    let coin =  constructor(mnemonic)
    print("after constructor coin: ", coin)
    return coin
  }
  class Coin {
    var wallet: HDWallet
    
    init(mnemonic: String) {
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: "") else {
        fatalError("Failed to create HDWallet")
      }
      self.wallet = wallet
    }
    
    func getNewAddress(isTestNet:Bool) -> String {
      fatalError("Subclasses must override getNewAddress()")
    }
    
    func getPrivateKey(isTestNet:Bool) -> String {
      fatalError("Subclasses must override getPrivateKey()")
    }
    
    func signTransaction(rawData: String) -> String {
      fatalError("Subclasses must override signTransaction(rawData:)")
    }
    func getPublicKeyHash() -> String {
      return ""
    }
    func getExtendedPublicKey(isTestNet:Bool) -> String {
      return ""
    }
    func getExtendedPrivateKey(isTestNet:Bool) -> String {
      return ""
    }
    func getDeriveAddresses() -> NSMutableArray {
      return []
    }
    func addCustomDerivation(derivePath:String) -> NSMutableDictionary {
      var params: NSMutableDictionary = [:]
      return params
    }
  }
}

