//
//  Utils.swift
//  coinswallet
//
//  Created by Divyang Khatri on 15/05/24.
//

import Foundation
import WalletCore

class Utils {
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
