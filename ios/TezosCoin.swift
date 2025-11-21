import Foundation
import WalletCore

class TezosCoin: CoinFactory.Coin {
  private var address: String = ""
  private var privateKey: String = ""
  
  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
    let privateKeyData =  wallet.getKeyForCoin(coin: .tezos)
    self.address = CoinType.tezos.deriveAddress(privateKey: privateKeyData)
    let publicKeyData = privateKeyData.getPublicKey(coinType: .tezos).data
    let privatePublicData = privateKeyData.data + publicKeyData;
    let prefix = Data([43, 246, 78, 7])
    let finalData = prefix + privatePublicData;
    self.privateKey = Base58.encode(data: finalData)
    
  }
  
  override func getNewAddress(isTestNet:Bool) -> String {
    return self.address
  }
  
  override func getPrivateKey(isTestNet:Bool) -> String {
    return self.privateKey
  }
  
  
  override func signTransaction(rawData: String) -> String {
    // Implement the logic to sign an Ethereum transaction using the provided raw data
    return ""
  }
}
