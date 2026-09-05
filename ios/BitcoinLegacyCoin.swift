import Foundation
import WalletCore

class BitcoinLegacyCoin: CoinFactory.Coin {

  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }

  // P2PKH (BIP-44). wallet-core's `.bitcoinTestnet` derivation is the BIP-84
  // segwit testnet preset (m/84'/1'/0', `tb1q…`), so it must not be used
  // here: on testnet the legacy type needs version byte 0x6f (`m…`/`n…`)
  // on the account path m/44'/1'/0'.
  private func buildP2PKHAddress(publicKey: PublicKey, isTestNet: Bool) -> String {
    let prefix: UInt8 = isTestNet ? 0x6f : 0x00
    return BitcoinAddress(publicKey: publicKey, prefix: prefix)?.description ?? ""
  }

  private func derivation(isTestNet: Bool) -> Derivation {
    return isTestNet ? .bitcoinTestnet : .bitcoinLegacy
  }

  private func firstReceiveKey(isTestNet: Bool) -> PrivateKey {
    return wallet.getKey(coin: .bitcoin, derivationPath: accountBasePath(isTestNet: isTestNet) + "/0/0")
  }

  override func getNewAddress(isTestNet: Bool) -> String {
    let publicKey = firstReceiveKey(isTestNet: isTestNet).getPublicKeySecp256k1(compressed: true)
    return buildP2PKHAddress(publicKey: publicKey, isTestNet: isTestNet)
  }

  override func getPrivateKey(isTestNet: Bool) -> String {
    return Utils.convertToWif(data: firstReceiveKey(isTestNet: isTestNet).data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
  }

  // The derivation only supplies the coin-type segment (0' / 1'), matching
  // BITCOIN_ADDRESS_TYPES.bitcoin_legacy: xpub on mainnet, tpub on testnet.
  override func getExtendedPublicKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPublicKeyDerivation(purpose: .bip44, coin: .bitcoin, derivation: derivation(isTestNet: isTestNet), version: isTestNet ? .tpub : .xpub)
  }

  override func getExtendedPrivateKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPrivateKeyDerivation(purpose: .bip44, coin: .bitcoin, derivation: derivation(isTestNet: isTestNet), version: isTestNet ? .tprv : .xprv)
  }

  override func signTransaction(rawData: String) -> String {
    return ""
  }

  override func addCustomDerivation(derivePath: String, isTestNet: Bool) -> NSMutableDictionary {
    let privateKey = wallet.getKey(coin: .bitcoin, derivationPath: derivePath)
    let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
    let address = buildP2PKHAddress(publicKey: publicKey, isTestNet: isTestNet)
    let dict: NSMutableDictionary = [:]
    dict["derivePath"] = derivePath
    dict["privateKey"] = Utils.convertToWif(data: privateKey.data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
    dict["address"] = address
    return dict
  }

  override func accountBasePath(isTestNet: Bool) -> String {
    return isTestNet ? "m/44'/1'/0'" : "m/44'/0'/0'"
  }

  override func getDeriveAddresses(isTestNet: Bool) -> NSMutableArray {
    // BIP44 standard: 20 external/receive (…/0/i) + 20 internal/change (…/1/i)
    let result = NSMutableArray()
    result.addObjects(from: getDeriveAddressRange(chainIndex: 0, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    result.addObjects(from: getDeriveAddressRange(chainIndex: 1, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    return result
  }
}
