//
//  CustomMethods.swift
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

import Foundation
import WalletCore

extension Data {
  func hexString() -> String {
    return map { String(format: "%02hhX", $0) }.joined()
  }
}

@objc(CustomMethods) class CustomMethods: NSObject {
  var coins: [String: CoinFactory.Coin] = [:]


  override init() {
    super.init()
    // Initialize any properties or perform additional setup here
    CoinFactory.registerCoin(name: "bitcoin") { mnemonic in
      return BitcoinCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "ethereum") { mnemonic in
      return EthereumCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "tron") { mnemonic in
      return TronCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "solana") { mnemonic in
      return SolanaCoin(mnemonic: mnemonic)
    }

    CoinFactory.registerCoin(name: "litecoin") { mnemonic in
      return LiteCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "ripple") { mnemonic in
      return RippleCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "thorchain") { mnemonic in
      return ThorCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "tezos") { mnemonic in
      return TezosCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "cosmos") { mnemonic in
      return CosmosCoin(mnemonic: mnemonic)
    } 
    CoinFactory.registerCoin(name: "polkadot") { mnemonic in
      return PolkadotCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "ton") { mnemonic in
      return TonCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "dogecoin") { mnemonic in
      return DogeCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "bitcoin_cash") { mnemonic in
      return BitcoinCashCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "aptos") { mnemonic in
      return AptosCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "cardano") { mnemonic in
      return CardanoCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "filecoin") { mnemonic in
      return FilecoinCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "bitcoin_legacy") { mnemonic in
      return BitcoinLegacyCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "bitcoin_segwit") { mnemonic in
      return BitcoinSegwitCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "bitcoin_taproot") { mnemonic in
      return BitcoinTaprootCoin(mnemonic: mnemonic)
    }
    CoinFactory.registerCoin(name: "zcash") { mnemonic in
      return ZcashCoin(mnemonic: mnemonic)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return true }
  @objc public func simpleMethod() { /* do something */ }
  @objc public func simpleMethodReturns(
    _ callback: RCTResponseSenderBlock
  ) {
    callback(["CustomMethods.simpleMethodReturns()"])
  }
  @objc public func simpleMethodWithParams(
    _ param: String,
    callback: RCTResponseSenderBlock
  ) {
    callback(["CustomMethods.simpleMethodWithParams('\(param)')"])
  }
  @objc public func throwError() throws {

  }

  @objc public func generateMnemonic(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    if let wallet = HDWallet(strength: 128, passphrase: "") {
      let mnemonic = wallet.mnemonic
      resolve(mnemonic)
    } else {
      reject("E_INVALID_WALLET", "Failed to create HDWallet", nil)
    }
  }

  //  @objc
  //  public func  getWallet(_ coinName: String, mnemonic: String,  _ resolve: RCTPromiseResolveBlock,
  //                 rejecter reject: RCTPromiseRejectBlock) {

  @objc public func getWallet(
    _ coinName: String,
    mnemonic: String,
    isTestNet: Bool,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {


    var coin = coins[mnemonic + ":" + coinName]
    if coin == nil {
      coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
      coins[mnemonic + ":" + coinName] = coin
    }

    if let unwrappedCoin = coin {
      let privateKeyHex = unwrappedCoin.getPrivateKey(isTestNet:isTestNet) // This is a hexadecimal String
      let publicKeyHex = unwrappedCoin.getPublicKeyHash()
      let extendedPublicKey = unwrappedCoin.getExtendedPublicKey(isTestNet: isTestNet )
      let extendedPrivateKey = unwrappedCoin.getExtendedPrivateKey(isTestNet: isTestNet )
    
      var result: [String: Any] = [
        "address": unwrappedCoin.getNewAddress(isTestNet: isTestNet),
        "privateKey": privateKeyHex,
        "publicKey": publicKeyHex,
        "extendedPublicKey": extendedPublicKey,
        "extendedPrivateKey": extendedPrivateKey
      ]
      // Coins with a BIP44 account base path (the bitcoin address types)
      // ship their receive/change address window with the wallet.
      if !unwrappedCoin.accountBasePath(isTestNet: isTestNet).isEmpty {
        result["deriveAddresses"] = unwrappedCoin.getDeriveAddresses(isTestNet: isTestNet)
      }
      resolve(result)
    } else {
      reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
    }
  }

  @objc public func getDeriveAddresses(
    _ coinName: String,
    mnemonic: String,
    isTestNet: Bool,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    var coin = coins[mnemonic + ":" + coinName]
    if coin == nil {
      coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
      coins[mnemonic + ":" + coinName] = coin
    }
    if let unwrappedCoin = coin {
      let deriveAddresses = unwrappedCoin.getDeriveAddresses(isTestNet: isTestNet)
      let result: [String: Any] = [
        "deriveAddresses": deriveAddresses,
      ]
      // Handle the 'result' dictionary as needed
      resolve(result)
    } else {
      reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
    }
  }
  
  @objc public func getDeriveAddressRange(
    _ coinName: String,
    mnemonic: String,
    isTestNet: Bool,
    chainIndex: NSNumber,
    startIndex: NSNumber,
    count: NSNumber,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    var coin = coins[mnemonic + ":" + coinName]
    if coin == nil {
      coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
      coins[mnemonic + ":" + coinName] = coin
    }
    if let unwrappedCoin = coin {
      let deriveAddresses = unwrappedCoin.getDeriveAddressRange(
        chainIndex: chainIndex.intValue,
        startIndex: startIndex.intValue,
        count: count.intValue,
        isTestNet: isTestNet
      )
      let result: [String: Any] = [
        "deriveAddresses": deriveAddresses,
      ]
      resolve(result)
    } else {
      reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
    }
  }

  @objc public func addCustomDerivation(
    _ coinName: String,
    mnemonic: String,
    derivePath: String,
    isTestNet: Bool,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
      var coin = coins[mnemonic + ":" + coinName]
      if coin == nil {
        coin = CoinFactory.createCoin(coinName: coinName, mnemonic: mnemonic)
        coins[mnemonic + ":" + coinName] = coin
      }
      if let unwrappedCoin = coin {
        let createAccount = unwrappedCoin.addCustomDerivation(derivePath: derivePath, isTestNet: isTestNet )
        let result: [String: Any] = [
          "account": createAccount,
        ]
        // Handle the 'result' dictionary as needed
        resolve(result)
      } else {
        reject("0","E_INVALID_COIN", NSError(domain: "", code: 0, userInfo: nil))
      }
  }

  // Builds, signs, and (for a dry run) plans a Zcash transparent (t-address)
  // transaction via WalletCore's native BitcoinV2/Zcash signer. Unlike the
  // doge/ltc/bch coins, Zcash can't be signed with bitcoinjs-lib in JS (its
  // tx format/sighash isn't Bitcoin-compatible), so the private key never
  // leaves native code here.
  //
  // Takes a raw private key (hex, 32 bytes) rather than a mnemonic: the JS
  // wallet layer only ever hands chain executors a WIF private key (not the
  // phrase), and Zcash reuses Bitcoin's WIF byte (0x80) so decoding it in JS
  // with the app's existing bitcoinjs-lib/ecpair dependency is enough to
  // recover the raw key -- see ZcashChain.js.
  //
  // `branchId` (hex string, no 0x prefix) is passed in from JS rather than
  // hardcoded, so a future Zcash network upgrade only needs a JS-side config
  // change, not a native release. `dryRun: true` returns a fee estimate
  // (via AnySigner.plan, no private key involved) instead of a signed tx.
  @objc public func signZcashTransaction(
    _ privateKeyHex: String,
    utxos: NSArray,
    fromAddress: String,
    toAddress: String,
    amountZatoshi: String,
    branchId: String,
    isTestNet: Bool,
    dryRun: Bool,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    guard let privateKeyData = Data(hexString: privateKeyHex),
          let privateKey = PrivateKey(data: privateKeyData) else {
      reject("E_INVALID_PRIVATE_KEY", "Invalid private key", nil)
      return
    }
    guard let amount = Int64(amountZatoshi) else {
      reject("E_INVALID_AMOUNT", "Invalid amount: \(amountZatoshi)", nil)
      return
    }
    guard let branchIdData = Data(hexString: branchId) else {
      reject("E_INVALID_BRANCH_ID", "Invalid consensus branch id: \(branchId)", nil)
      return
    }

    let publicKey = privateKey.getPublicKey(coinType: .zcash)
    // Our own wallet's pubkey hash -- computed directly rather than by
    // decoding `fromAddress`, since we already have the key that produced it.
    let ourPubkeyHash = Hash.sha256RIPEMD(data: publicKey.data)

    // Zcash transparent P2PKH address prefixes (2 bytes, unlike Bitcoin's
    // 1-byte prefixes): mainnet t1... = 0x1CB8, testnet tm... = 0x1D25.
    let p2pkhPrefix: [UInt8] = isTestNet ? [0x1d, 0x25] : [0x1c, 0xb8]

    // Scripts are built from raw pubkey hashes (below), not from address
    // strings via `receiverAddress`/`toAddress` -- WalletCore's `CoinType
    // .zcash` is registered as a mainnet-only coin, and its own address
    // parsing may not honor a caller-supplied testnet prefix the way a
    // hash-based script does, regardless of `chainInfo`. The recipient
    // address is the one part we don't already hold the hash for, so it's
    // decoded (and its prefix validated) explicitly here.
    guard let recipientHash = Utils.decodeP2PKHHash(address: toAddress, expectedPrefix: p2pkhPrefix) else {
      reject("E_INVALID_ADDRESS", "toAddress is not a valid transparent P2PKH address for this network: \(toAddress)", nil)
      return
    }

    var builderInputs: [BitcoinV2Input] = []
    for item in utxos {
      guard let utxo = item as? NSDictionary,
            let txid = utxo["txid"] as? String,
            let vout = utxo["vout"] as? NSNumber,
            let valueStr = utxo["valueZatoshi"] as? String,
            let value = Int64(valueStr),
            let txidData = Data(hexString: txid) else {
        reject("E_INVALID_UTXO", "Invalid utxo entry: \(item)", nil)
        return
      }
      var outPoint = UtxoOutPoint()
      // `txid` here is the usual display/explorer hex (big-endian). WalletCore's
      // outpoint hash wants the raw little-endian transaction hash, i.e. the
      // display txid bytes reversed -- same convention as a Bitcoin raw tx.
      outPoint.hash = Data(txidData.reversed())
      outPoint.vout = vout.uint32Value

      var claimingScript = BitcoinV2PublicKeyOrHash()
      claimingScript.hash = ourPubkeyHash

      var input = BitcoinV2Input()
      input.outPoint = outPoint
      input.value = value
      input.sighashType = BitcoinSigHashType.all.rawValue
      input.scriptBuilder.p2Pkh = claimingScript
      builderInputs.append(input)
    }
    guard !builderInputs.isEmpty else {
      reject("E_NO_UTXOS", "No spendable UTXOs provided", nil)
      return
    }

    var recipientScript = BitcoinV2PublicKeyOrHash()
    recipientScript.hash = recipientHash
    var recipientOutput = BitcoinV2Output()
    recipientOutput.value = amount
    recipientOutput.builder.p2Pkh = recipientScript

    var changeScript = BitcoinV2PublicKeyOrHash()
    changeScript.hash = ourPubkeyHash
    var changeOutput = BitcoinV2Output()
    changeOutput.builder.p2Pkh = changeScript

    var extraData = ZcashTransactionBuilderExtraData()
    extraData.branchID = branchIdData
    extraData.expiryHeight = 0
    extraData.zip0317 = true

    var builder = BitcoinV2TransactionBuilder()
    builder.version = .useDefault
    builder.inputs = builderInputs
    builder.outputs = [recipientOutput]
    builder.inputSelector = .selectAscending
    builder.changeOutput = changeOutput
    builder.fixedDustThreshold = 546
    builder.zcashExtraData = extraData

    var signingInput = BitcoinV2SigningInput()
    signingInput.builder = builder
    // Required: WalletCore's BitcoinV2 compiler needs these version-byte
    // prefixes to build/serialize the change output's script for a coin it
    // doesn't have compiled-in defaults for (CoinType.zcash is registered as
    // mainnet-only, per the note on `p2pkhPrefix` above). Without it,
    // AnySigner.sign() has been observed returning `.ok` with empty
    // `encoded` bytes rather than an explicit error. Single-byte, matching
    // the second byte of the 2-byte prefixes used elsewhere in this file
    // (mainnet t1.../t3... = 0xB8/0xBD, testnet tm.../t2... = 0x25/0xBA).
    signingInput.chainInfo = BitcoinV2ChainInfo.with {
      $0.p2PkhPrefix = isTestNet ? 0x25 : 0xb8
      $0.p2ShPrefix = isTestNet ? 0xba : 0xbd
    }

    // AnySigner.{plan,sign} are pure protobuf-bytes dispatchers keyed only by
    // `coin` (see AnySigner.swift: they serialize whatever message type is
    // passed and hand the raw bytes to native code) -- there is no type
    // safety tying the Swift call to what the native side actually expects
    // to deserialize. For CoinType.zcash specifically, WalletCore's own test
    // suite (ZcashTests.swift/testSignV2) shows it expects the *legacy*
    // `BitcoinSigningInput` message with the V2 builder nested inside via
    // `signingV2`, not a bare `BitcoinV2SigningInput` -- passing the V2
    // message directly used to silently deserialize as a mostly-empty legacy
    // input (no parse error, since protobuf just treats the mismatched
    // fields as unknown), which is why this returned `error: .ok` with empty
    // `encoded` bytes instead of a real failure. `signingInput` is a struct
    // (value type), so this wrap is built fresh in each branch below, after
    // publicKeys/privateKeys are set on it -- wrapping it once up here would
    // capture a copy from before either key was attached.
    if dryRun {
      signingInput.publicKeys = [publicKey.data]
      let legacyInput = BitcoinSigningInput.with {
        $0.signingV2 = signingInput
        $0.coinType = CoinType.zcash.rawValue
      }
      let legacyPlan: BitcoinTransactionPlan = AnySigner.plan(input: legacyInput, coin: .zcash)
      if legacyPlan.error != .ok {
        reject("E_PLAN_FAILED", "legacy plan error \(legacyPlan.error.rawValue)", nil)
        return
      }
      let plan = legacyPlan.planningResultV2
      if plan.error != .ok {
        reject("E_PLAN_FAILED", plan.errorMessage, nil)
        return
      }
      let result: [String: Any] = [
        "feeEstimate": String(plan.feeEstimate),
        "vsizeEstimate": String(plan.vsizeEstimate),
        "availableAmount": String(plan.availableAmount),
        "change": String(plan.change),
      ]
      resolve(result)
    } else {
      signingInput.privateKeys = [privateKey.data]
      let legacyInput = BitcoinSigningInput.with {
        $0.signingV2 = signingInput
        $0.coinType = CoinType.zcash.rawValue
      }
      let legacyOutput: BitcoinSigningOutput = AnySigner.sign(input: legacyInput, coin: .zcash)
      if legacyOutput.error != .ok {
        reject("E_SIGN_FAILED", legacyOutput.errorMessage, nil)
        return
      }
      let signingOutput = legacyOutput.signingResultV2
      if signingOutput.error != .ok {
        reject("E_SIGN_FAILED", signingOutput.errorMessage, nil)
        return
      }
      // Belt-and-suspenders: reject with WalletCore's own error code/message
      // attached instead of resolving an empty raw transaction (which JS
      // could only diagnose as an opaque "no rawTransaction" downstream).
      guard !signingOutput.encoded.isEmpty else {
        reject(
          "E_SIGN_EMPTY",
          "WalletCore returned no transaction bytes (error=\(signingOutput.error.rawValue), message=\(signingOutput.errorMessage))",
          nil
        )
        return
      }
      let result: [String: Any] = [
        "rawTransaction": signingOutput.encoded.hexString(),
        "txid": signingOutput.txid.hexString(),
        "fee": String(signingOutput.fee),
      ]
      resolve(result)
    }
  }
}
