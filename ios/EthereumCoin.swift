//
//  EthereumCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class EthereumCoin: CoinFactory.Coin {
    private var address: String = ""

    override init(mnemonic: String) {
        super.init(mnemonic: mnemonic)
        self.address = CoinType.ethereum.deriveAddress(privateKey: wallet.getKeyForCoin(coin: .ethereum))
    }

    override func getNewAddress(isTestNet:Bool) -> String {
        return self.address
    }

    override func getPrivateKey(isTestNet:Bool) -> String {
        let privateKeyBytes = wallet.getKeyForCoin(coin: .ethereum).data
        return privateKeyBytes.hexString
    }

  override func getDeriveAddresses() -> NSMutableArray {
    let result: NSMutableArray = []
    for i in 0..<50 {
          let derivePath = String(format: "m/44'/60'/0'/%@/0", String(i))
          let privateKey = wallet.getKey(coin: .ethereum, derivationPath: derivePath)
          let address = CoinType.ethereum.deriveAddress(privateKey: privateKey)
          let yourAuxDic: NSMutableDictionary = [:]
          yourAuxDic["derivePath"] = derivePath
          yourAuxDic["privateKey"] = privateKey.data.hexString
          yourAuxDic["address"] = address
          result.add(yourAuxDic)
      }
      return result;
    }
  
  override func addCustomDerivation(derivePath:String) -> NSMutableDictionary {
      let privateKey = wallet.getKey(coin: .ethereum, derivationPath: derivePath)
      let address = CoinType.ethereum.deriveAddress(privateKey: privateKey)
      let yourAuxDic: NSMutableDictionary = [:]
      yourAuxDic["derivePath"] = derivePath
      yourAuxDic["privateKey"] = privateKey.data.hexString
      yourAuxDic["address"] = address
      return yourAuxDic;
  }



    override func signTransaction(rawData: String) -> String {
        // Implement the logic to sign an Ethereum transaction using the provided raw data
        return ""
    }
}
