//
//  CustomMethods.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import LocalAuthentication
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
    CoinFactory.registerCoin(name: "bitcoin_legacy") { mnemonic in
      return BitcoinLegacyCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "bitcoin_segwit") { mnemonic in
      return BitcoinSegwitCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "bitcoin_taproot") { mnemonic in
      return BitcoinTaprootCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "zcash") { mnemonic in
      return ZcashCoin(mnemonic: mnemonic)
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

  // react-native-sensitive-info signs each item's metadata (kSecAttrGeneric,
  // JSON) with an HMAC key it keeps ThisDeviceOnly, so an unprotected item
  // moved to a new iPhone (Quick Start / encrypted computer backup) fails that
  // check and is never returned. RNSI accepts an entry without `integrityTag`
  // as legacy and stamps it on its next write, so this drops the stale tag
  // with one SecItemUpdate: the value, its access control and accessibility
  // stay untouched and the item is never deleted. Never prompts. Resolves
  // "cleared", "untagged", "absent", or "protected" (stored policy is not
  // "none": left alone).
  @objc public func clearKeychainIntegrityTag(
    _ service: String,
    key: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    let context = LAContext()
    context.interactionNotAllowed = true
    let item: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecUseAuthenticationContext as String: context,
    ]
    var lookup = item
    lookup[kSecReturnAttributes as String] = true
    lookup[kSecMatchLimit as String] = kSecMatchLimitOne
    var result: CFTypeRef?
    let status = SecItemCopyMatching(lookup as CFDictionary, &result)
    if status == errSecItemNotFound {
      resolve("absent")
      return
    }
    guard status == errSecSuccess, let attributes = result as? [String: Any] else {
      reject("E_KEYCHAIN_READ", "Keychain lookup failed: OSStatus \(status)", nil)
      return
    }
    guard let generic = attributes[kSecAttrGeneric as String] as? Data,
          var metadata = (try? JSONSerialization.jsonObject(with: generic)) as? [String: Any] else {
      // No readable metadata: RNSI already treats the item as legacy.
      resolve("untagged")
      return
    }
    guard (metadata["accessControl"] as? String) == "none" else {
      resolve("protected")
      return
    }
    guard metadata.removeValue(forKey: "integrityTag") != nil else {
      resolve("untagged")
      return
    }
    guard let updated = try? JSONSerialization.data(withJSONObject: metadata) else {
      reject("E_KEYCHAIN_METADATA", "Keychain metadata could not be encoded", nil)
      return
    }
    let changes: [String: Any] = [kSecAttrGeneric as String: updated]
    let updateStatus = SecItemUpdate(item as CFDictionary, changes as CFDictionary)
    if updateStatus == errSecSuccess {
      resolve("cleared")
    } else {
      reject("E_KEYCHAIN_UPDATE", "Keychain update failed: OSStatus \(updateStatus)", nil)
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
    
      var result: [String: Any] = [
        "address": unwrappedCoin.getNewAddress(isTestNet: isTestNet),
        "privateKey": privateKeyHex,
        "publicKey": publicKeyHex,
        "extendedPublicKey": extendedPublicKey,
        "extendedPrivateKey": extendedPrivateKey
      ]
      // Coins with a BIP44 account base path (the bitcoin address types)
      // ship their receive/change address window with the wallet.
      if !unwrappedCoin.accountBasePath(isTestNet: isTestNet).isEmpty {
        result["deriveAddresses"] = unwrappedCoin.getDeriveAddresses(isTestNet: isTestNet)
      }
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
      let deriveAddresses = unwrappedCoin.getDeriveAddresses(isTestNet: isTestNet)
      let result: [String: Any] = [
        "deriveAddresses": deriveAddresses,
      ]
      // Handle the 'result' dictionary as needed
      resolve(result)
    } else {
      reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
    }
  }
  
  @objc public func getDeriveAddressRange(
    _ coinName: String,
    mnemonic: String,
    isTestNet: Bool,
    chainIndex: NSNumber,
    startIndex: NSNumber,
    count: NSNumber,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    var coin = coins[mnemonic + ":" + coinName]
    if coin == nil {
      coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
      coins[mnemonic + ":" + coinName] = coin
    }
    if let unwrappedCoin = coin {
      let deriveAddresses = unwrappedCoin.getDeriveAddressRange(
        chainIndex: chainIndex.intValue,
        startIndex: startIndex.intValue,
        count: count.intValue,
        isTestNet: isTestNet
      )
      let result: [String: Any] = [
        "deriveAddresses": deriveAddresses,
      ]
      resolve(result)
    } else {
      reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
    }
  }

  @objc public func addCustomDerivation(
    _ coinName: String,
    mnemonic: String,
    derivePath: String,
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
        let createAccount = unwrappedCoin.addCustomDerivation(derivePath: derivePath, isTestNet: isTestNet )
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
