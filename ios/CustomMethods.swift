//
//  CustomMethods.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

extension Data {
  func hexString() -> String {
    return map { String(format: "%02hhX", $0) }.joined()
  }
}

@objc(CustomMethods) class CustomMethods: NSObject {
  var coins: [String: CoinFactory.Coin] = [:]


  override init() {
    super.init()
    // Initialize any properties or perform additional setup here
    CoinFactory.registerCoin(name: "bitcoin") { mnemonic in
      return BitcoinCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "ethereum") { mnemonic in
      return EthereumCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "tron") { mnemonic in
      return TronCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "solana") { mnemonic in
      return SolanaCoin(mnemonic: mnemonic)
    }

    CoinFactory.registerCoin(name: "litecoin") { mnemonic in
      return LiteCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "ripple") { mnemonic in
      return RippleCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "thorchain") { mnemonic in
      return ThorCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "tezos") { mnemonic in
      return TezosCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "cosmos") { mnemonic in
      return CosmosCoin(mnemonic: mnemonic)
    } 
    CoinFactory.registerCoin(name: "polkadot") { mnemonic in
      return PolkadotCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "ton") { mnemonic in
      return TonCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "dogecoin") { mnemonic in
      return DogeCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "bitcoin_cash") { mnemonic in
      return BitcoinCashCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "aptos") { mnemonic in
      return AptosCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "cardano") { mnemonic in
      return CardanoCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "filecoin") { mnemonic in
      return FilecoinCoin(mnemonic: mnemonic)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return true }
  @objc public func simpleMethod() { /* do something */ }
  @objc public func simpleMethodReturns(
    _ callback: RCTResponseSenderBlock
  ) {
    callback(["CustomMethods.simpleMethodReturns()"])
  }
  @objc public func simpleMethodWithParams(
    _ param: String,
    callback: RCTResponseSenderBlock
  ) {
    callback(["CustomMethods.simpleMethodWithParams('\(param)')"])
  }
  @objc public func throwError() throws {

  }

  @objc public func generateMnemonic(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    if let wallet = HDWallet(strength: 128, passphrase: "") {
      let mnemonic = wallet.mnemonic
      resolve(mnemonic)
    } else {
      reject("E_INVALID_WALLET", "Failed to create HDWallet", nil)
    }
  }

  //  @objc
  //  public func  getWallet(_ coinName: String, mnemonic: String,  _ resolve: RCTPromiseResolveBlock,
  //                 rejecter reject: RCTPromiseRejectBlock) {

  @objc public func getWallet(
    _ coinName: String,
    mnemonic: String,
    isTestNet: Bool,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {


    var coin = coins[mnemonic + ":" + coinName]
    if coin == nil {
      coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
      coins[mnemonic + ":" + coinName] = coin
    }

    if let unwrappedCoin = coin {
      let privateKeyHex = unwrappedCoin.getPrivateKey(isTestNet:isTestNet) // This is a hexadecimal String
      let publicKeyHex = unwrappedCoin.getPublicKeyHash()
      let extendedPublicKey = unwrappedCoin.getExtendedPublicKey(isTestNet: isTestNet )
      let extendedPrivateKey = unwrappedCoin.getExtendedPrivateKey(isTestNet: isTestNet )
      let result: [String: Any] = [
        "address": unwrappedCoin.getNewAddress(isTestNet: isTestNet),
        "privateKey": privateKeyHex,
        "publicKey": publicKeyHex,
        "extendedPublicKey": extendedPublicKey,
        "extendedPrivateKey": extendedPrivateKey
      ]
      // Handle the 'result' dictionary as needed

      resolve(result)
    } else {
      reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
    }
  }

  @objc public func getDeriveAddresses(
    _ coinName: String,
    mnemonic: String,
    isTestNet: Bool,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    var coin = coins[mnemonic + ":" + coinName]
    if coin == nil {
      coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
      coins[mnemonic + ":" + coinName] = coin
    }
    if let unwrappedCoin = coin {
      let deriveAddresses = unwrappedCoin.getDeriveAddresses()
      let result: [String: Any] = [
        "deriveAddresses": deriveAddresses,
      ]
      // Handle the 'result' dictionary as needed
      resolve(result)
    } else {
      reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
    }
  }
  
  @objc public func addCustomDerivation(
    _ coinName: String,
    mnemonic: String,
    derivePath: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
      var coin = coins[mnemonic + ":" + coinName]
      if coin == nil {
        coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
        coins[mnemonic + ":" + coinName] = coin
      }
      if let unwrappedCoin = coin {
        let createAccount = unwrappedCoin.addCustomDerivation(derivePath: derivePath )
        let result: [String: Any] = [
          "account": createAccount,
        ]
        // Handle the 'result' dictionary as needed
        resolve(result)
      } else {
        reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
      }
  }
}
