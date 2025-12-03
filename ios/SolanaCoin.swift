//
//  TronCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class SolanaCoin: CoinFactory.Coin {

    override init(mnemonic: String) {
        super.init(mnemonic: mnemonic)
    }

    override func getNewAddress(isTestNet:Bool) -> String {
        let address = wallet.getAddressDerivation(coin: .solana, derivation: .solanaSolana)
        return address
    }

    override func getPrivateKey(isTestNet:Bool) -> String {
      let privateKey = wallet.getKeyDerivation(coin: .solana, derivation: .solanaSolana)
      return convertToCustomPrivateKey(privateKey: privateKey);
    }

  override func getDeriveAddresses() -> NSMutableArray {
    let result: NSMutableArray = []
    let firstDict: NSMutableDictionary = [:]
    firstDict["derivePath"] = "m/44'/501'/0'/0'"
    firstDict["privateKey"] =  getPrivateKey(isTestNet: false)
    firstDict["address"] = getNewAddress(isTestNet: false)
    result.add(firstDict)
    for i in 0..<50 {
          let derivePath = String(format:  "m/44'/501'/%@'", String(i))
          let privateKey = wallet.getKey(coin: .solana, derivationPath: derivePath)
          let address = CoinType.solana.deriveAddress(privateKey: privateKey);
          let yourAuxDic: NSMutableDictionary = [:]
          yourAuxDic["derivePath"] = derivePath
          yourAuxDic["privateKey"] =  convertToCustomPrivateKey(privateKey: privateKey)
          yourAuxDic["address"] = address
          result.add(yourAuxDic)
      }
      return result;
    }

   func convertToCustomPrivateKey(privateKey:PrivateKey) -> String {
    let publicKeyData = privateKey.getPublicKeyEd25519().data
    let privateKeyData = privateKey.data
    let finalData = privateKeyData + publicKeyData
    let privateKeyString =  Base58.encodeNoCheck(data: finalData)
    return privateKeyString
  }


  override func addCustomDerivation(derivePath:String) -> NSMutableDictionary {
      let privateKey = wallet.getKey(coin: .solana, derivationPath: derivePath)
      let address = CoinType.solana.deriveAddress(privateKey: privateKey)
      let yourAuxDic: NSMutableDictionary = [:]
      yourAuxDic["derivePath"] = derivePath
      yourAuxDic["privateKey"] =  convertToCustomPrivateKey(privateKey: privateKey)
      yourAuxDic["address"] = address
      return yourAuxDic;
  }


    override func signTransaction(rawData: String) -> String {
        // Implement the logic to sign a Tron transaction using the provided raw data
        return ""
    }
}
