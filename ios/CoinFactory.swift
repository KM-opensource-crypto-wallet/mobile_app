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
    func getDeriveAddresses(isTestNet: Bool) -> NSMutableArray {
      return getDeriveAddresses()
    }
    func addCustomDerivation(derivePath:String, isTestNet:Bool) -> NSMutableDictionary {
      var params: NSMutableDictionary = [:]
      return params
    }
    // BIP44 account base path, e.g. "m/84'/0'/0'". Coins that support ranged
    // derivation override this; others keep the empty default.
    func accountBasePath() -> String {
      return ""
    }
    // Derives `count` addresses on one BIP44 chain (0 = receive, 1 = change)
    // starting at `startIndex`, reusing each coin's addCustomDerivation so the
    // address type (bech32 / p2sh / legacy) stays coin-specific.
    func getDeriveAddressRange(chainIndex: Int, startIndex: Int, count: Int, isTestNet: Bool) -> NSMutableArray {
      let result = NSMutableArray()
      let basePath = accountBasePath()
      if basePath.isEmpty || count <= 0 || startIndex < 0 || chainIndex < 0 {
        return result
      }
      for i in startIndex..<(startIndex + count) {
        result.add(addCustomDerivation(derivePath: "\(basePath)/\(chainIndex)/\(i)", isTestNet: isTestNet))
      }
      return result
    }
  }
}

