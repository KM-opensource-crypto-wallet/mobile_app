//
//  Utils.swift
//  coinswallet
//
//  Created by Divyang Khatri on 15/05/24.
//

import Foundation
import WalletCore

class Utils {
  // Base58Check-encodes a version prefix + payload (e.g. a pubkey hash), for
  // address formats -- like Zcash's transparent addresses -- whose version
  // prefix is more than the single byte bitcoinjs-lib/WalletCore's own
  // `CoinType.deriveAddress` assume.
  static func encodeBase58CheckAddress(prefix: [UInt8], payload: Data) -> String {
    let versionedPayload = Data(prefix) + payload
    let checksum = Data(Hash.sha256SHA256(data: versionedPayload).prefix(4))
    return Base58.encodeNoCheck(data: versionedPayload + checksum)
  }

  // Inverse of encodeBase58CheckAddress: verifies the checksum (via
  // WalletCore's own Base58.decode) and the version prefix, returning just
  // the 20-byte hash160 payload. Used to build P2PKH scripts directly from an
  // address's hash rather than handing the address string to WalletCore's
  // own per-coin address parsing -- which, for a coin like Zcash that's
  // registered as mainnet-only, may not honor a caller-supplied testnet
  // prefix the same way a raw hash-based script does.
  static func decodeP2PKHHash(address: String, expectedPrefix: [UInt8]) -> Data? {
    guard let decoded = Base58.decode(string: address) else { return nil }
    let prefixLength = expectedPrefix.count
    guard decoded.count == prefixLength + 20 else { return nil }
    guard Array(decoded.prefix(prefixLength)) == expectedPrefix else { return nil }
    return Data(decoded.suffix(20))
  }

  static func convertToWif(data: Data,isTestNet:Bool,prefix: [UInt8], testNetPrefix: [UInt8] ) -> String{
    let privateKeyData = data
    var prefix = Data(prefix)
    if(isTestNet){
      prefix = Data(testNetPrefix)
    }
    let extendedPrivateKeyData = prefix + privateKeyData + Data([0x01])
    let firstSHA256 = extendedPrivateKeyData.dataSha256()
    let secondSHA256Data = Data(hexString: firstSHA256)
    let secondSHA256 = secondSHA256Data!.dataSha256()
    let checksum = Data(hexString: secondSHA256,numberOfBytes: 4)!
    let finalData = extendedPrivateKeyData + checksum
    let wif = Base58.encodeNoCheck(data:finalData)
    return wif
  }
}
