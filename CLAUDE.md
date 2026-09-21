# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this codebase.

## Project Overview

DOK Wallet is a non-custodial cryptocurrency wallet mobile application built with React Native. It supports multiple blockchain networks and has two app variants: **dokwallet** and **kimlwallet**.

## Tech Stack

- **React Native**: 0.86
- **React**: 19.2.3
- **State Management**: Redux Toolkit + Redux Saga
- **Persistence**: Redux Persist with sensitive storage
- **Navigation**: React Navigation (drawer, stack, native-stack)
- **UI Components**: React Native Paper, RNEUI
- **Camera**: react-native-vision-camera (QR scanning)
- **Node Version**: >=22

## Project Structure

```
src/
├── assets/          # Images, fonts, and static assets
├── components/      # Reusable UI components (100+ components)
├── data/            # Static data (aboutList, currency, data)
├── hooks/           # Custom React hooks
│   ├── useBottomSheetBackHandler.js
│   ├── useFloatingWidth.js
│   ├── useGroupCoins.js
│   └── useKeyboardHeight.js
├── myWallet/        # Wallet-related utilities
├── redux/           # Redux store configuration (store.js)
├── routers/         # Navigation configuration (router.js)
├── screens/         # Screen components
│   ├── auth/        # Authentication screens
│   ├── main/        # Main app screens
│   └── temp/        # Temporary/utility screens
├── shims/           # Polyfills for Node.js modules
├── theme/           # Theme configuration (ThemeContext)
└── utils/           # Utility functions
    ├── asyncStorage.js
    ├── common.js
    ├── dimensions.js
    ├── hapticFeedback.js
    ├── navigation.js
    ├── toast.js
    ├── validationSchema.js
    └── xmtp.js        # XMTP messaging utilities
```

## Main Screens

```
screens/main/
├── About/           # App information
├── BuyCrypto/       # Fiat on-ramp
├── ContactUs/       # Support contact
├── Exchange/        # Token swaps
├── Home/            # Main dashboard
│   ├── HomeScreen/
│   ├── ManageCoins/
│   ├── SendFunds/
│   ├── RecieveFunds/
│   ├── Transfer/         # Send transactions with advanced fees
│   ├── TransactionList/
│   ├── SelectUTXOsScreen/
│   ├── CreateStaking/
│   ├── StakingList/
│   ├── VoteStaking/
│   ├── WithdrawStaking/
│   ├── Message/         # XMTP messaging
│   ├── MessageList/
│   └── NewMessage/
├── Scanner/         # QR code scanning (react-native-vision-camera)
├── SellCrypto/      # Fiat off-ramp
├── Settings/        # App settings
├── ResetWallet/     # Wallet reset flow
├── WalletConnect/   # dApp connections
└── Wallets/         # Wallet management
    ├── CreateWallet/
    └── SelectCoins/     # Coin selection during wallet creation
```

## Key Components

- **AdvancedFeesSheet**: Bottom sheet for custom gas/fee configuration
  - Supports fee presets (Recommended, Fast, Rapid)
  - Custom gas price input
  - Custom nonce input for EVM chains
  - Uses `@gorhom/bottom-sheet` with `BottomSheetTextInput`
- **DokBottomSheet**: Reusable bottom sheet wrapper component
- **SelectCoins**: Screen for selecting coins when creating a new wallet
  - SectionList with search functionality
  - Supports chain validation via `validateSupportedChain`
- **WalletsPicker/WalletsPickerSheet**: Wallet selection UI
- **CoinItem/CoinIcon/CoinGroupList**: Coin display and grouping
- **AddCoins/ModalAddCoins**: Add new tokens to wallet
- **WalletConnect***: dApp connection components
- **BatchTransaction***: Batch transaction handling
- **AddressBook***: Contact management

## Common Commands

```bash
# Install dependencies
yarn install

# iOS setup
cd ios && pod install && cd ..

# Run iOS
yarn dokwallet:ios       # DOK Wallet variant
yarn kimlwallet:ios      # KIML Wallet variant

# Run Android
yarn dokwallet:android   # DOK Wallet variant
yarn kimlwallet:android  # KIML Wallet variant

# Start Metro bundler
yarn start
yarn clean:start         # Start with cache reset

# Linting
yarn lint

# Testing
yarn test

# Build Android
yarn build:android:apk   # Build APK
yarn build:android:aab   # Build AAB

# Clean builds
yarn clean:android
yarn clean:ios
yarn clean:all

# Update git submodules
yarn git:update
```

## Supported Blockchains

The app integrates with multiple blockchain networks via `dok-wallet-blockchain-networks` submodule:

- **Bitcoin-based**: Bitcoin, Bitcoin Cash (bitcoinjs-lib, bchaddrjs)
- **EVM Chains**: Ethereum, BSC, Polygon, etc. (ethers.js)
- **Solana**: SOL and SPL tokens (@solana/web3.js)
- **Cosmos Ecosystem**: Cosmos, Osmosis, etc. (@cosmjs)
- **XRP/Ripple**: (xrpl)
- **TON**: (@ton/ton)
- **Tezos**: (@taquito)
- **Polkadot**: (@polkadot/api)
- **Stellar**: (@stellar/stellar-sdk)
- **Filecoin**: (filecoin.js)
- **Hedera**: (@hashgraph/sdk)
- **Aptos**: (@aptos-labs/ts-sdk)
- **Cardano**: (@meshsdk/core)
- **THORChain**: (@xchainjs/xchain-thorchain)
- **Tron**: (tronweb)

## Key Features

- **Multi-wallet support**: Create and manage multiple wallets with coin selection
- **WalletConnect v2**: Connect to dApps via @reown/walletkit
- **Staking**: Create, vote, and withdraw staking positions
- **XMTP Messaging**: In-app encrypted messaging
- **Advanced Fees**: Custom gas price, gas limit, and nonce for EVM chains
  - Fee presets: Recommended, Fast, Rapid
  - Integrated in Transfer screen via AdvancedFeesSheet
- **UTXO Selection**: Manual UTXO selection for Bitcoin-based chains
- **Batch Transactions**: Group multiple transactions
- **QR Scanner**: Camera-based QR code scanning with react-native-vision-camera
- **Biometric Auth**: Fingerprint/Face ID authentication
- **Address Book**: Save and manage contacts

## Architecture Notes

- **Submodule**: `dok-wallet-blockchain-networks` contains:
  - Blockchain ABIs (`abis/` folder)
  - Network configurations
  - Redux slices for currency, wallets, transfers, exchange, settings
  - Helper functions (`helper.js`): `isEVMChain`, `isBitcoinChain`, `validateSupportedChain`, `isFeesOptionChain`, `GAS_CURRENCY`
- **Bitcoin address types**: `bitcoin` (BIP-84 `bc1q`), `bitcoin_segwit` (BIP-49 `3…`), `bitcoin_legacy` (BIP-44 `1…`), `bitcoin_taproot` (BIP-86 `bc1p`, key-path P2TR, BIP-322 message signing). All share `BitcoinChain.js`; per-type purpose / extended-key version bytes / legacy-window flag live in `BITCOIN_ADDRESS_TYPES` in `dok-wallet-blockchain-networks/service/bitcoinHdAddress.js`, and `buildAddressByChain` is the one place that maps a pubkey to an address. Mnemonic derivation (20 receive + 20 change) is native via TrustWalletCore: `ios/Bitcoin*Coin.swift` and `android/.../coins/Bitcoin*Coin.java`; each coin's `accountBasePath` must match `getAccountBasePath`.
- **Sensitive Storage**: Uses `react-native-sensitive-info` for private keys
- **Secure storage / vault (Phases 1–5 landed; QA + R9b measurement pending)**: spec in `docs/superpowers/specs/2026-09-19-secure-storage-final-plan.md` (identical copy in the web repo). Shared, platform-free code lives in the submodule and reaches platform code only through two bare aliases each app resolves to its own file, exactly like `myWallet/wallet.service`: `security/vaultCrypto` (mobile `src/security/vaultCrypto.js` on react-native-quick-crypto; web on WebCrypto + a KDF worker) and `security/secureStore` (mobile on react-native-sensitive-info 5.6.2 under `SECURE_STORE_KEYCHAIN_NAME`; web on IndexedDB). Submodule: `security/vaultCore.js` (envelope v1, PBKDF2-SHA256 600k → AES-256-GCM, `ct` carries the tag, AAD per purpose), `security/vault.js` (DEK in memory, `createVault`/`unlockWithPassword`/`verifyPassword`/`changePassword`/biometric/`saveSecrets`/`getStateKey`/`destroy`), `redux/wallets/walletSecrets.js` (`SECRET_WALLET_FIELDS`, strip/extract/hydrate/`assertNoSecrets`), `walletsSlice.hydrateWalletSecrets`, `auth.hasAccount` + `getHasAccount` (the `password` field and `getUserPassword` are gone: `signUpSuccess`/`logInSuccess`/`changePasswordSuccess` take no payload), `redux/storage/legacyRootMigration.js` (pure split/verify helpers). Mobile Tier 1 = `react-native-mmkv` 4.3.2 AES-256 with a 32-char key in the secure store (`src/redux/storage/{bootstrap,mmkvStorage,wipe}.js`, reinstall detection); web Tier 1 = IndexedDB with `plain` and DEK-sealed `sealed` stores. `security/__fixtures__/vault.v1.json` is asserted in both repos' Jest runs and is the cross-platform envelope proof; never edit it in place. `src/redux/storage/persistTiming.js` is the dev-only R9a baseline hook (`serialize` in the persist config). Never branch on platform inside the submodule; every submodule change must be checked against both apps.
- **Secure storage runtime (Phase 2)**: The migrator never enrols biometrics: react-native-sensitive-info evaluates an OS auth policy on every biometric-protected *write* and on iOS falls back to the device passcode when biometrics cannot be evaluated (nothing enrolled, locked out, simulator) — a boot-time OS prompt. Enrolment happens after the first password unlock (`unlockFlow.ensureBiometricEnrolled`) and only when `vault.isBiometricAvailable()` (adapter: `FingerprintScanner.isSensorAvailable()`) is true. RNSI read options take `prompt`, write options take `authenticationPrompt`; the Keychain keeps an existing item's policy on update, so `enableBiometric` deletes before writing. The iOS simulator does not enforce Keychain access-control flags, so biometric unlock must be QA'd on a physical device. `src/redux/store.js` is `combineReducers` of one `persistReducer` per persisted slice (`persist:<slice>` in MMKV, `timeout: 0`, `throttle: 1000`, field-level transforms from `redux/storage/persistTransforms.js`), plus the `vaultSync` listener (`security/vaultSync.js`: immediate vault write for wallet-creating actions, debounced otherwise; `resetWallet` empties the vault, `logOutSuccess` destroys it). Boot: `App.js` awaits `bootstrapStorage()` (Android SharedPreferences step, reinstall detection, MMKV key, open, `migrateLegacyRoot2` when `storage.schemaVersion` is 0; a migration failure keeps the promise rejected and shows `StorageErrorScreen`), then lazily requires `MainApp`, which wraps `Main` in `PersistGate`. `index.js` sets `setBootstrapContext('headless')` before requiring the store so the notifee task never runs the 600k KDF (partial migration, redone on the next foreground launch). Login goes through `src/security/unlockFlow.js` thunks (`unlockWithPassword` / `unlockWithBiometric` → `hydrateWalletSecrets` → refuse wallets without keys → `vaultUnlocked` → finalize migration 2→3 → enrol biometric copy if the setting is on); every former `=== password` check is `vault.verifyPassword`, ChangePassword is `vault.changePassword`, Registration is `vault.createVault`, Delete-all-data is `wipeAllLocalData`. Routing uses `getHasAccount`; WalletConnect starts only once `auth.isVaultUnlocked` (transient, blacklisted) is true; the WC transaction modal signs with `selectLivePrivateKey`. Web mirrors this with plain (`auth`, `settings`) and DEK-sealed IndexedDB slices: `unlockFlow.js` there unseals reads, `getStoredState` + `persist/REHYDRATE` per sealed slice, then enables writes. Legacy blobs are retained until the first unlock finalises them.
- **Secure storage — ordering rules learned from the regression audit**: `resetCoinsToDefaultAddressForPrivacyMode` and `reassignCurrentWalletIfHidden` run AFTER `hydrateWalletSecrets` (both apps, in `unlockFlow`), never pre-unlock: the privacy reset moves a coin's address and key together, and with keys stripped it would pair the default address with the previously selected address's key once the vault fills it in. The reducers now refuse to re-point an address whose derive key is absent. WalletConnect `walletData[*].address` is the ledger account id for native Hedera sessions, so `selectLivePrivateKey` also matches `accountId`.
- **Secure storage — hardening (Phase 5)**: `vault.unlockWithPassword` re-wraps the DEK in place when the stored KDF parameters are below the current constant (upgrade path, blob untouched). Android `res/xml/{backup_rules,data_extraction_rules}.xml` exclude `files/mmkv/` and all SharedPreferences (incl. `sensitive_info.xml`) from backup and device transfer; iOS app entitlements carry `com.apple.developer.default-data-protection = NSFileProtectionComplete` (the Data Protection capability must be enabled for both bundle ids in the developer portal, and files are unreadable while the device is locked — only `remote-notification` background mode is declared, so no background writer depends on them). `hooks/usePreventScreenshot` guards Login and CustomDerivation (VerifyCreate keeps its inline version). WalletConnect approve (both apps) now goes through `ModalConfirmTransaction` (D2). Web zeroise-on-lock: `lockSession()` (idle timeout + logout) flushes the vault listener, dispatches `walletsSlice.clearWalletSecrets`, seals the storage adapter and locks the vault; re-login hydrates. Mobile keeps secrets in memory behind the lock modal on purpose: pending-tx sending/polling, refresh intervals and WalletConnect requests sign while locked and would need queueing first (spec §6.3). Web `wallet-lightning.service.js` keys its SDK maps by SHA-256 of the mnemonic (W5). Not done: WebAuthn-PRF biometric on web, sealing mobile Tier 1 under the state key.
- **Secure storage — slimming (Phase 4)**: the shared wallets transform (`redux/storage/persistTransforms.js`) persists at most the 200 most recent `coins[*].transactions` per coin (by `date`; a refresh replaces the list wholesale), never persists the `nft` cache (refetched by `fetchNft`), and strips list-shaped fields (`transactions`, `deriveAddresses`, `UTXOs`, `staking`, `nft`) from WalletConnect `walletData` entries — the session UI only reads address/symbol/chain fields, and nothing rebuilds `walletData` from sessions, so it must stay persisted. `createMessagePersistTransform` (mobile only) keeps the newest 100 messages per XMTP conversation inside the encrypted store; there is no plaintext message cache by design. Limits live in `WALLET_PERSIST_LIMITS`. Measuring R9b: Settings › "Log persist timing" (dev / `SENTRY_DEV_TOOLS`) on mobile, `window.__dokPersistTiming()` in a dev web build; compare against the Phase 1 baseline on the same wallet set and put the numbers in the PR.
- **Secure storage — deliberately still present until migration coverage is confirmed**: `crypto-js` and the inlined `REDUX_WEB_KEY` on web (the only way to decrypt an un-migrated `persist:root`), the Android SharedPreferences step in `src/redux/storage/bootstrap.js` (pre-RNSI-5 blobs), and the legacy `persist:root2` reader in `migrateLegacyRoot2.js`. Remove them only when Sentry shows `storage.migration` finalised for ~100 % of active installs; removing earlier makes every un-migrated user's upgrade fail with the storage error screen. `redux-persist-sensitive-storage` (mobile) and `redux-persist-transform-encrypt` (web) are already removed.
- **Integrity / Attestation**: Dok API integrity is centralized in `dok-wallet-blockchain-networks/config/dokApi.js`
  - Shared `DokApi` request interception attaches platform integrity headers
  - Android uses Play Integrity standard requests
  - iOS uses App Attest registration + assertion generation
  - Secure storage is used only for persisting the iOS App Attest key registration state
- **Hedera accounts**: No operator/admin key. The wallet's ECDSA key (Ethereum path) gives the EVM address, which is the coin's `address` everywhere and never changes. The first deposit auto-creates the ledger account (HIP-583, sender pays); its `0.0.N` is stored in a separate `accountId` field and shown only on the Receive screen and in the Send flow. `isHederaUnactivated` / `getHederaLedgerAddress` in `helper/index.js` gate and feed exchange, on-ramp and WalletConnect, which need `0.0.N`. SDK is `@hiero-ledger/sdk`. Fees come from the mirror node fee estimator (`FeeEstimateQuery`, HIP-1261) plus the live exchange rate, never from constants; `estimatedFee` is what is charged, `fee` is the max-fee cap. `send` refuses accounts whose on-chain key is not the wallet's (legacy operator-keyed accounts) with `HEDERA_KEY_MISMATCH_MESSAGE`. Mirror `GET /transactions/{id}` lists child records first; `HEDERA.getTransaction` must pick the `nonce === 0` parent.
- **Hedera WalletConnect**: one coin serves two CAIP-2 ids. `hedera:<net>` (HIP-820: six `hedera_*` methods, account `0.0.N`, wire shapes match `@hashgraph/hedera-wallet-connect` — prefixed `signMessage`, base64 protobuf `SignatureMap`, `TransactionResponse.toJSON()`, node rejections as JSON-RPC error 9000) and `eip155:<chain_id>` (295/296 via the hashio JSON-RPC relay, account `0x…`). `CHAIN_CONFIG.hedera.wallet_connect_evm` adds the second key; `WALLET_CONNECT_SUPPORTED_CHAIN` entries carry `namespace`. `HederaChain().evm` is the `EVMChain('hedera')` executor, chosen by `getWalletConnectExecutor` in `helper/walletConnectCoin.js` from the request `chainId`. Session building lives in `helper/walletConnectSession.js`; approved namespaces always carry `chains` (Reown AppKit reads `session.namespaces.eip155.chains` to pick the active chain and falls back to `eip155:1` without it). `hedera_getNodeAddresses`, `wallet_switchEthereumChain` (EIP-3326: `null` / 4902) and `wallet_addEthereumChain` (EIP-3085: `null` only for chains we serve) are auto-answered in `service/walletconnect.js` via `helper/walletConnectEvmChain.js`. `@hiero-ledger/proto` is a direct dependency for `SignatureMap`/`TransactionBody` encoding.
- **Error reporting (Sentry)**: `@sentry/react-native`, one project per variant (`DOK_WALLET_SENTRY_DSN` / `KIML_WALLET_SENTRY_DSN`, selected by `wlName` in `src/utils/wlData.js`). All observability goes through `src/services/logger` (`initSentry`, `logger.{debug,info,warn,error}`, `captureError(err, {tags, extra, level})`, `addBreadcrumb`, `setUserContext`); never import `@sentry/*` elsewhere. Captured: uncaught errors + unhandled rejections, native crashes, both ErrorBoundaries, every `console.*` as a Sentry Log (Bugfender parity), and structured logs at chokepoints (send, wallet create/import, WalletConnect, `dokapi.failed`, every `*/rejected` thunk via a store middleware, navigation/lifecycle/toast breadcrumbs). `user.id` is the persisted `masterClientId`; tag/attribute `variant`. `scrub.js` redacts mnemonics, hex/WIF/xprv keys, sensitive JSON keys and axios bodies in `beforeSend`/`beforeBreadcrumb`/`beforeSendLog`; call sites must still not pass addresses or amounts (only `tx_hash` is allow-listed). Disabled in debug builds unless `SENTRY_ENABLE_IN_DEV=true`; `SENTRY_DEV_TOOLS=true` shows a "Send Sentry test event" row in Settings. No source-map upload yet (JS frames are minified in the dashboard).
- **Node Polyfills**: Uses `rn-nodeify` for crypto, stream, etc.
- **CI/CD**: Codemagic configuration in `codemagic.yaml`
- **Theming**: Context-based theming via `ThemeContext`
- **Splash Screen**: Handled via `react-native-bootsplash` (initialized in `src/components/main.js`)

## Redux Structure

Key selectors and slices from `dok-wallet-blockchain-networks/redux/`:
- `currency/currencySlice`: `fetchAllCoins`, `fetchAllSearchCoins`
- `currency/currencySelectors`: `selectAllCoins`, `selectAllActiveCurrencies`, `isAllCoinsLoading`
- `wallets/walletsSlice`: `createWallet`, `setCurrentCoin`, `sendFunds`
- `wallets/walletsSelector`: `selectUserCoins`, `selectCurrentWallet`, `getCurrentWalletPhrase`
- `currentTransfer/`: Transfer state management with fee options
- `settings/settingsSelectors`: `getLocalCurrency`

## Development Notes

- When running locally on Android, set `android:usesCleartextTraffic="true"` in AndroidManifest.xml (both main and debug). Set to false for release builds.
- The postinstall script runs `rn-nodeify` and `patch-package` automatically
- Patches are stored in the `patches/` directory
- Component imports use path aliases (e.g., `import X from 'components/X'`)
- Bottom sheets use `@gorhom/bottom-sheet` with `DokBottomSheet` wrapper
- New app services should prefer small feature folders under `src/` instead of adding more code into the blockchain submodule unless the concern is truly shared chain logic.
- `DokApi` is the app/backend seam. Cross-cutting backend request headers should be attached there rather than scattered across individual service calls.
