# DOK Wallet

A non-custodial, multi-chain cryptocurrency wallet for iOS and Android, built with React Native.

Keys never leave the device. The app is shipped in two white-label variants from the same codebase: **DOK Wallet** and **KIML Wallet**.

## Features

- **Multi-wallet, multi-chain**: create or import several wallets and pick the coins each one tracks
- **Bitcoin address types**: native SegWit (`bc1q`), nested SegWit (`3…`), legacy (`1…`) and Taproot (`bc1p`), with manual UTXO selection
- **WalletConnect v2**: connect to dApps via Reown WalletKit, including Hedera (HIP-820) and EVM sessions
- **Staking**: create, vote on and withdraw staking positions on supported chains
- **Buy / sell / swap**: fiat on-ramp, off-ramp and token exchange
- **Advanced fees**: fee presets plus custom gas price, gas limit and nonce on EVM chains
- **Batch transactions** and **scheduled payments**
- **Address book**, **QR scanning** and **in-app XMTP messaging**
- **Security**: password-derived encrypted vault (PBKDF2 + AES-256-GCM), biometric unlock, encrypted on-device storage, screenshot protection on sensitive screens, Play Integrity / App Attest for backend calls

## Supported networks

Bitcoin, Bitcoin Cash, Zcash, Ethereum and EVM chains (BSC, Polygon, Arc and others), Solana, Cosmos ecosystem, XRP, TON, Tezos, Polkadot, Stellar, Filecoin, Hedera, Aptos, Cardano, THORChain, Tron and Lightning.

Chain integrations live in the [`blockchains`](https://github.com/KM-opensource-crypto-wallet/blockchains) repository, consumed here as the `dok-wallet-blockchain-networks` git submodule and shared with the web wallet.

## Tech stack

| Area | Library |
| --- | --- |
| Framework | React Native 0.86, React 19 |
| State | Redux Toolkit, Redux Saga, Redux Persist |
| Navigation | React Navigation |
| UI | React Native Paper, RNEUI, `@gorhom/bottom-sheet` |
| Storage | `react-native-mmkv` (AES-256), `react-native-sensitive-info` (Keychain / Keystore) |
| Crypto | `react-native-quick-crypto`, TrustWalletCore (native key derivation) |
| Camera | `react-native-vision-camera` |
| Error reporting | Sentry |

## Requirements

- Node.js >= 22.11
- Yarn
- Xcode with CocoaPods (iOS)
- Android Studio with an SDK and JDK 17 (Android)
- Watchman (recommended on macOS)

## Getting started

```bash
git clone --recurse-submodules git@github.com:KM-opensource-crypto-wallet/mobile_app.git
cd mobile_app
yarn install            # also runs rn-nodeify and patch-package
cp .env.example .env    # fill in the values you need
```

If you cloned without submodules:

```bash
git submodule update --init --recursive
```

### iOS

```bash
cd ios && pod install && cd ..
yarn dokwallet:ios      # or: yarn kimlwallet:ios
```

### Android

```bash
yarn dokwallet:android  # or: yarn kimlwallet:android
```

For local Android builds set `android:usesCleartextTraffic="true"` in both `android/app/src/main/AndroidManifest.xml` and `android/app/src/debug/AndroidManifest.xml`. Set it back to `false` for release builds.

### Environment variables

All configuration comes from `.env` (see `.env.example` for the full list with comments). Values are inlined at bundle time by `react-native-dotenv`. The backend URL, WalletConnect project ids, OneSignal, Sentry DSNs and the secure-storage keychain names are all configured there. Firebase config files (`google-services.json`, `GoogleService-Info.plist`) are not committed; add your own or run `yarn setup:google-services` if you have access to the private config repo.

## Scripts

```bash
yarn start               # Metro bundler
yarn clean:start         # Metro with cache reset
yarn lint                # ESLint (auto-fix)
yarn test                # Jest
yarn build:android:apk   # Release APK
yarn build:android:aab   # Release AAB
yarn clean:android       # Clean Android build
yarn clean:ios           # Clean iOS build
yarn git:update          # Update git submodules
```

## Project structure

```
src/
├── assets/        # Images, fonts
├── components/    # Reusable UI components
├── hooks/         # Custom hooks
├── redux/         # Store, persistence and storage bootstrap
├── routers/       # Navigation
├── screens/       # auth/ and main/ screens
├── security/      # Vault crypto and secure store adapters
├── services/      # Logger (Sentry) and other app services
├── shims/         # Node polyfills for Hermes
├── theme/         # Theming
└── utils/         # Helpers
dok-wallet-blockchain-networks/   # Shared chain logic, redux slices, vault core (submodule)
```

Path aliases resolve from `src/` (for example `import X from 'components/X'`). See `CLAUDE.md` for detailed architecture notes.

## Contributing

Issues and pull requests are welcome. Please run `yarn lint` and `yarn test` before opening a PR. Changes to the submodule must be checked against both the mobile app and the web wallet, and platform-specific code must stay out of the submodule.

## Security

This wallet handles private keys. If you find a vulnerability, please report it privately to the maintainers rather than opening a public issue.

## License

This project is licensed under the [MIT License](LICENSE).

**Trademark notice**: the names "DOK Wallet" and "KIML Wallet" and their logos are not covered by the MIT License. You are free to use, modify and redistribute the code, but forks and derived apps must not use these names or logos, or imply endorsement by the original authors, without written permission. Please rename and rebrand your fork.
