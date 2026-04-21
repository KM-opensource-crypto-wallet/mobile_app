# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this codebase.

## Project Overview

DOK Wallet is a non-custodial cryptocurrency wallet mobile application built with React Native. It supports multiple blockchain networks and has two app variants: **dokwallet** and **kimlwallet**.

## Tech Stack

- **React Native**: 0.83.1
- **React**: 19.2.0
- **State Management**: Redux Toolkit + Redux Saga
- **Persistence**: Redux Persist with sensitive storage
- **Navigation**: React Navigation (drawer, stack, native-stack)
- **UI Components**: React Native Paper, RNEUI
- **Camera**: react-native-vision-camera (QR scanning)
- **Node Version**: >=20

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
- **Sensitive Storage**: Uses `react-native-sensitive-info` for private keys
- **Integrity / Attestation**: Dok API integrity is centralized in `dok-wallet-blockchain-networks/config/dokApi.js`
  - Shared `DokApi` request interception attaches platform integrity headers
  - Android uses Play Integrity standard requests
  - iOS uses App Attest registration + assertion generation
  - Secure storage is used only for persisting the iOS App Attest key registration state
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
