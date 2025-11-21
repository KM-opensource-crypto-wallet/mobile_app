//
//  BitcoinCoin.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//


import Foundation
import WalletCore

class BitcoinCoin: CoinFactory.Coin {
  private var addressIndex: Int = 0
  
  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }
  
  override func getNewAddress(isTestNet:Bool) -> String {
    var derivation = Derivation.bitcoinSegwit;
    if(isTestNet){
      derivation =  Derivation.bitcoinTestnet
    }
    let address  = wallet.getAddressDerivation(coin: .bitcoin, derivation: derivation)
    addressIndex += 1
    return address
  }
  
  override func getExtendedPublicKey(isTestNet:Bool) -> String {
    var derivation = Derivation.bitcoinSegwit;
    var version = HDVersion.zpub;
    if(isTestNet){
      derivation =  Derivation.bitcoinTestnet
      version = HDVersion.vpub
    }
    let extendedKey = wallet.getExtendedPublicKeyDerivation(purpose: .bip84, coin: .bitcoin, derivation: derivation, version: version);
    return extendedKey
  }
  
  override func getExtendedPrivateKey(isTestNet:Bool) -> String {
    var derivation = Derivation.bitcoinSegwit;
    var version = HDVersion.zprv;
    if(isTestNet){
      derivation =  Derivation.bitcoinTestnet
      version = HDVersion.vprv
    }
    let extendedKey = wallet.getExtendedPrivateKeyDerivation(purpose: .bip84, coin: .bitcoin, derivation: derivation, version: version);
    return extendedKey
  }
  
  override func getPrivateKey(isTestNet:Bool) -> String {
    
    var derivation = Derivation.bitcoinSegwit;
    if(isTestNet){
      derivation =  Derivation.bitcoinTestnet
    }
    let privateKeyBytes = wallet.getKeyDerivation(coin: .bitcoin, derivation: derivation).data
    return Utils.convertToWif(data: privateKeyBytes, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
  }
  
  override func signTransaction(rawData: String) -> String {
    // Implement the logic to sign a Bitcoin transaction using the provided raw data
    return ""
  }
}
