import Foundation
import WalletCore

// BIP-86 key-path taproot (P2TR, bech32m `bc1p…`). Mirrors
// BITCOIN_ADDRESS_TYPES.bitcoin_taproot in
// dok-wallet-blockchain-networks/service/bitcoinHdAddress.js: purpose 86',
// plain xpub/xprv (tpub/tprv on testnet), WIF holds the untweaked key.
class BitcoinTaprootCoin: CoinFactory.Coin {

  override init(mnemonic: String) {
    super.init(mnemonic: mnemonic)
  }

  private func derivation(isTestNet: Bool) -> Derivation {
    return isTestNet ? .bitcoinTestnet : .bitcoinTaproot
  }

  // WalletCore tweaks the key (BIP-341) and bech32m-encodes it for mainnet
  // only. For testnet we re-encode the same witness program under the `tb`
  // hrp: Bech32.decodeM/encodeM convert the whole 5-bit symbol stream to
  // bytes and back, which is lossless for a v1 program (1 version symbol +
  // 52 program symbols = 265 bits = 33 bytes + one zero pad bit), so this
  // is a pure hrp/checksum swap.
  private func buildTaprootAddress(publicKey: PublicKey, isTestNet: Bool) -> String {
    let mainnetAddress = AnyAddress(publicKey: publicKey, coin: .bitcoin, derivation: .bitcoinTaproot).description
    guard isTestNet, let program = Bech32.decodeM(string: mainnetAddress) else {
      return mainnetAddress
    }
    return Bech32.encodeM(hrp: "tb", data: program)
  }

  private func firstReceiveKey(isTestNet: Bool) -> PrivateKey {
    return wallet.getKey(coin: .bitcoin, derivationPath: accountBasePath(isTestNet: isTestNet) + "/0/0")
  }

  override func getNewAddress(isTestNet: Bool) -> String {
    let publicKey = firstReceiveKey(isTestNet: isTestNet).getPublicKeySecp256k1(compressed: true)
    return buildTaprootAddress(publicKey: publicKey, isTestNet: isTestNet)
  }

  override func getPrivateKey(isTestNet: Bool) -> String {
    return Utils.convertToWif(data: firstReceiveKey(isTestNet: isTestNet).data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
  }

  override func getExtendedPublicKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPublicKeyDerivation(purpose: .bip86, coin: .bitcoin, derivation: derivation(isTestNet: isTestNet), version: isTestNet ? .tpub : .xpub)
  }

  override func getExtendedPrivateKey(isTestNet: Bool) -> String {
    return wallet.getExtendedPrivateKeyDerivation(purpose: .bip86, coin: .bitcoin, derivation: derivation(isTestNet: isTestNet), version: isTestNet ? .tprv : .xprv)
  }

  override func signTransaction(rawData: String) -> String {
    return ""
  }

  override func addCustomDerivation(derivePath: String, isTestNet: Bool) -> NSMutableDictionary {
    let privateKey = wallet.getKey(coin: .bitcoin, derivationPath: derivePath)
    let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
    let dict: NSMutableDictionary = [:]
    dict["derivePath"] = derivePath
    dict["privateKey"] = Utils.convertToWif(data: privateKey.data, isTestNet: isTestNet, prefix: [0x80], testNetPrefix: [0xef])
    dict["address"] = buildTaprootAddress(publicKey: publicKey, isTestNet: isTestNet)
    return dict
  }

  override func accountBasePath(isTestNet: Bool) -> String {
    return isTestNet ? "m/86'/1'/0'" : "m/86'/0'/0'"
  }

  override func getDeriveAddresses(isTestNet: Bool) -> NSMutableArray {
    // BIP86 standard: 20 external/receive (…/0/i) + 20 internal/change (…/1/i)
    let result = NSMutableArray()
    result.addObjects(from: getDeriveAddressRange(chainIndex: 0, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    result.addObjects(from: getDeriveAddressRange(chainIndex: 1, startIndex: 0, count: 20, isTestNet: isTestNet) as! [Any])
    return result
  }
}
