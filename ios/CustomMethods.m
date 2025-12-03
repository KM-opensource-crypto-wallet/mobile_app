//
//  CustomMethods.m
//  coinswallet
//
//  Created by Tal Grynbaum on 30/06/2023.
//

#import <Foundation/Foundation.h>
#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
@interface RCT_EXTERN_MODULE(CustomMethods, NSObject)

RCT_EXTERN_METHOD(simpleMethod)
RCT_EXTERN_METHOD(simpleMethodReturns:
                  (RCTResponseSenderBlock) callback
                  )
RCT_EXTERN_METHOD(simpleMethodWithParams:
                  (NSString *) param
                  callback: (RCTResponseSenderBlock)callback
                  )
RCT_EXTERN_METHOD(
                  generateMnemonic: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject
                  )

RCT_EXTERN_METHOD(getWallet:
                  (NSString *) coinName
                  mnemonic: (NSString *)mnemonic
                  isTestNet: (BOOL) isTestnet
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject
                  )
RCT_EXTERN_METHOD(getDeriveAddresses:
                  (NSString *) coinName
                  mnemonic: (NSString *)mnemonic
                  isTestNet: (BOOL) isTestnet
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject
                  )
RCT_EXTERN_METHOD(addCustomDerivation:
                  (NSString *) coinName
                  mnemonic: (NSString *)mnemonic
                  derivePath: (NSString) derivePath
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject
                  )
@end

