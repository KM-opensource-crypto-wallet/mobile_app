//
//  commonExternsion.swift
//  coinswallet
//
//  Created by Divyang's Macbook Pro on 13/09/23.
//

import Foundation
import CryptoKit
import CommonCrypto

@available(iOS 13.0, *)
extension Digest {
  var bytes: [UInt8] { Array(makeIterator()) }
  var data: Data { Data(bytes) }
  
  var hexStr: String {
    bytes.map { String(format: "%02X", $0) }.joined()
  }
}



extension Data{
  public func dataSha256() -> String{
    return hexStringFromData(input: digest(input: self as NSData))
  }
  
  private func digest(input : NSData) -> NSData {
    let digestLength = Int(CC_SHA256_DIGEST_LENGTH)
    var hash = [UInt8](repeating: 0, count: digestLength)
    CC_SHA256(input.bytes, UInt32(input.length), &hash)
    return NSData(bytes: hash, length: digestLength)
  }
  
  private  func hexStringFromData(input: NSData) -> String {
    var bytes = [UInt8](repeating: 0, count: input.length)
    input.getBytes(&bytes, length: input.length)
    
    var hexString = ""
    for byte in bytes {
      hexString += String(format:"%02x", UInt8(byte))
    }
    
    return hexString
  }
  init?(hexString: String) {
    let len = hexString.count / 2
    var data = Data(capacity: len)
    var i = hexString.startIndex
    for _ in 0..<len {
      let j = hexString.index(i, offsetBy: 2)
      let bytes = hexString[i..<j]
      if var num = UInt8(bytes, radix: 16) {
        data.append(&num, count: 1)
      } else {
        return nil
      }
      i = j
    }
    self = data
  }
  init?(hexString: String,numberOfBytes:Int) {
    let len = hexString.count / 2
    var data = Data(capacity: len)
    var i = hexString.startIndex
    for _ in 0..<numberOfBytes {
      let j = hexString.index(i, offsetBy: 2)
      let bytes = hexString[i..<j]
      if var num = UInt8(bytes, radix: 16) {
        data.append(&num, count: 1)
      } else {
        return nil
      }
      i = j
    }
    self = data
  }
}


public extension String {
  func strSha256() -> String{
    if let stringData = self.data(using: String.Encoding.utf8) {
      return stringData.dataSha256()
    }
    return ""
  }
}

