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
    // Mirrors RECEIVE_CHAIN / CHANGE_CHAIN / MAX_ADDRESSES_PER_CHAIN in
    // dok-wallet-blockchain-networks/service/bitcoinHdAddress.js.
    static let receiveChain = 0
    static let changeChain = 1
    static let maxDeriveRangeCount = 500

    // BIP44 account base path, e.g. "m/84'/0'/0'". The coin-type segment
    // differs per network (0' mainnet, 1' testnet), so overrides receive
    // isTestNet; this must stay in step with getAccountBasePath in
    // dok-wallet-blockchain-networks/service/bitcoinHdAddress.js. Coins that
    // support ranged derivation override this; others keep the empty default.
    func accountBasePath(isTestNet: Bool) -> String {
      return ""
    }
    // Derives `count` addresses on one BIP44 chain (0 = receive, 1 = change)
    // starting at `startIndex`, reusing each coin's addCustomDerivation so the
    // address type (bech32 / p2sh / legacy) stays coin-specific.
    //
    // Every step is a full BIP32 derivation, and this is reachable from JS
    // through the getDeriveAddressRange bridge method, so the range is
    // bounded: an unbounded count would block the caller and exhaust memory.
    // BIP44 defines exactly two chains, and the per-chain cap matches
    // MAX_ADDRESSES_PER_CHAIN in bitcoinHdAddress.js. The Int.max guard keeps
    // the range expression below from trapping on overflow. Invalid input
    // yields no addresses, as before.
    func getDeriveAddressRange(chainIndex: Int, startIndex: Int, count: Int, isTestNet: Bool) -> NSMutableArray {
      let result = NSMutableArray()
      let basePath = accountBasePath(isTestNet: isTestNet)
      if basePath.isEmpty
        || count <= 0
        || count > Coin.maxDeriveRangeCount
        || startIndex < 0
        || (chainIndex != Coin.receiveChain && chainIndex != Coin.changeChain)
        || startIndex > Int.max - count {
        return result
      }
      for i in startIndex..<(startIndex + count) {
        result.add(addCustomDerivation(derivePath: "\(basePath)/\(chainIndex)/\(i)", isTestNet: isTestNet))
      }
      return result
    }
  }
}

