# Changelog

All notable changes to the iOS and Android apps built from this repository are listed here, newest first.

Entries are grouped by the month the change was merged into `main`, with a link to its pull request. Store version numbers are set at build time by Codemagic (`codemagic.yaml`); each store release includes every change merged before its build.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 2026-11

### Added
- Batch transaction handling and UI updates ([#142](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/142)).

### Fixed
- Sentry reporting brought in line with the web wallet ([#145](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/145)).
- Batch contract repair ([#144](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/144)).
- Derived key mismatch ([#143](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/143)).

## 2026-10

### Added
- WalletConnect `wallet_getCallsStatus` support ([#139](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/139)).

### Changed
- WalletConnect updates ([#141](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/141)).

### Fixed
- WalletConnect fixes ([#140](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/140), [#133](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/133)).
- Contact support issues ([#138](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/138)).
- Dropped Solana transactions ([#137](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/137)).
- iPhone backup ([#136](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/136)).
- Storage safety ([#134](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/134)).

### Security
- Shell dependency vulnerabilities ([#135](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/135)).

## 2026-09

### Added
- Encrypted secure-storage vault v2 ([#129](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/129), fixes in [#130](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/130) and [#132](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/132)).
- Zcash ([#127](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/127)).
- Arc chain ([#128](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/128)).
- Scheduled payments ([#122](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/122), fixes in [#125](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/125)).
- Sentry error reporting ([#124](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/124)).
- TON, Stellar and XRP in WalletConnect ([#102](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/102)).

### Changed
- The app is licensed under GPL-3.0 ([#131](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/131)).
- Environment variable handling and dependency updates ([#119](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/119)).

## 2026-08

### Added
- Uniswap, ParaSwap and LI.FI swaps ([#96](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/96)).
- Direct Electrum connections for Bitcoin ([#118](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/118)).
- Wallet identifier ([#116](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/116)).

### Fixed
- Bitcoin Lightning ([#121](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/121)).
- Electrum connections and tests ([#120](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/120)).
- Google Drive backup ([#114](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/114)).
- General bug fixes ([#115](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/115)).

### Security
- Dependency vulnerabilities ([#117](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/117)).

## 2026-07

### Added
- Hidden wallets, revealed only by their secret code ([#107](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/107)).
- Robinhood chain ([#112](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/112), [#113](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/113)).

### Fixed
- Coin sync ([#110](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/110)).
- Xcode build ([#109](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/109)).
- Screenshot crash on Android ([#108](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/108)).

## 2026-06

### Added
- Aave staking for USDC and USDT ([#86](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/86)).
- Video tutorials ([#99](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/99)).

### Changed
- React Native 0.86.0 ([#104](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/104)).
- Removed unused device capabilities ([#106](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/106)).
- Payment options hidden ([#105](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/105)).
- White-label app certificate update ([#101](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/101)).

### Fixed
- Address poisoning detection ([#103](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/103)).
- Apple Pay logo ([#100](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/100)).

## 2026-05

### Added
- Up to 100 transactions in EVM history ([#98](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/98)).
- Option to hide small transactions ([#97](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/97)).
- Transaction details ([#93](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/93)).
- Notifications ([#85](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/85)).

### Fixed
- General bug fixes ([#95](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/95)).

## 2026-04

### Added
- App attestation for backend requests ([#89](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/89), [#90](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/90), [#92](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/92)).

### Fixed
- Xcode 26.4 build ([#94](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/94)).
- Coin sync ([#83](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/83)).
- Tron ([#80](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/80), [#81](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/81)).

### Security
- Dependency vulnerabilities ([#84](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/84), [#88](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/88)).

## 2026-03

### Added
- CoinSync ([#59](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/59)).
- Custom Bitcoin derived addresses ([#64](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/64)).
- Custom RPC URL per chain ([#76](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/76)).

### Changed
- Create wallet screen redesign ([#75](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/75)).

## 2026-02

### Added
- Bitcoin Lightning through the Breez SDK ([#53](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/53), [#68](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/68)).
- Encrypted Google Drive backup and restore ([#62](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/62), [#66](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/66), [#67](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/67)).
- Checked state in coin selection ([#63](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/63)).

### Changed
- Buy crypto removed from the white-label app ([#69](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/69), [#70](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/70)).

### Security
- Dependency vulnerabilities ([#72](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/72)).

## 2026-01

### Added
- Advanced fee options: presets, custom gas price and nonce ([#54](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/54)).
- Coin selection when creating a wallet ([#51](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/51)).
- Backup and restore ([#55](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/55), [#61](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/61)).
- "Don't show again" option on modals ([#60](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/60)).

### Changed
- React Native 0.82.1 ([#46](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/46), Android fixes in [#50](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/50)).

### Fixed
- Splash screen stuck on launch ([#57](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/57)).
- Xcode build ([#49](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/49)).
- Codemagic Yarn setup ([#48](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/48)).

### Security
- Dependency vulnerabilities ([#52](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/52), [#56](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/56)).

## 2025-11

### Added
- Login security ([#37](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/37)).
- Buy crypto in the white-label iOS app ([#42](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/42)).

### Changed
- White-label app update ([#39](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/39)).
- OTC card position and alignment ([#35](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/35), [#36](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/36)).

### Fixed
- Modal updates ([#41](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/41)).
- Keyboard issues ([#40](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/40)).
- General bug fixes ([#44](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/44)).

### Security
- node-forge vulnerabilities ([#43](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/43)).

## 2025-10

### Security
- Dependency vulnerabilities ([#34](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/34)).

## 2025-09

### Added
- EIP-7702 batch transactions ([#31](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/31)).
- Sei ([#33](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/33)).
- Chain names ([#30](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/30)).

### Fixed
- EVM issues ([#32](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/32)).
- Android issues ([#28](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/28)).

## 2025-08

### Changed
- Buy crypto removed ([#27](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/27)).
- Android update ([#23](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/23)).

### Fixed
- Staking ([#26](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/26)).
- Links ([#25](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/25)).
- Add Coins screen ([#24](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/24)).

## 2025-07

### Added
- Apple Pay ([#18](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/18)).
- White-label app entitlements, Add Coins and deep links ([#17](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/17)).

### Changed
- White-label app update ([#22](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/22)).
- Buy, sell and swap removed from the white-label app ([#20](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/20)).
- URL update ([#15](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/15)).

### Fixed
- Yarn setup ([#19](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/19)).

## 2025-06

### Added
- Account deletion ([#13](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/13), [#14](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/14)).
- White-label app for iOS ([#10](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/10), [#11](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/11)).

### Fixed
- Coinify issues ([#12](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/12)).

### Security
- Dependency vulnerabilities ([#9](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/9)).

## 2025-05

### Added
- White-label app ([#7](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/7)).
- Filecoin ([#3](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/3), [#5](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/5)).

### Fixed
- Codemagic build ([#6](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/6)).

### Security
- Dependency vulnerabilities ([#8](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/8)).

## 2025-04

### Added
- First public release of the source code.

### Fixed
- Cardano issues ([#2](https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/2)).
