//
//  EthereumCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

class ThorCoin: CoinFactory.Coin {
    private var address: String = ""

    override init(mnemonic: String) {
        super.init(mnemonic: mnemonic)
      self.address = CoinType.thorchain.deriveAddress(privateKey: wallet.getKeyForCoin(coin: .thorchain))
    }
  

    override func getNewAddress(isTestNet:Bool) -> String {
        return self.address
    }

    override func getPrivateKey(isTestNet:Bool) -> String {
        let privateKeyBytes = wallet.getKeyForCoin(coin: .thorchain).data
        return Base64.encode(data: privateKeyBytes)
    }

    override func signTransaction(rawData: String) -> String {
        // Implement the logic to sign an Ethereum transaction using the provided raw data
        return ""
    }
}
