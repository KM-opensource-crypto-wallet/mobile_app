# Secure Storage & Key-Management Redesign — Implementation Plan

Date: 2026-09-18
Status: SUPERSEDED 2026-09-19 by `2026-09-19-secure-storage-final-plan.md` (kept as history). Originally: APPROVED 2026-09-18 — plan only, implementation not started. Execute phase by phase with the superpowers `executing-plans` workflow (TDD per task).
App: DOK Wallet / KIML Wallet — React Native 0.86.3, New Architecture, Hermes, Nitro modules already in the build.

---

## 0. Context — why this change

Two issues were reported:

1. **UI freezes on every persisted write.** Redux Persist serialises the *entire* persisted state into one string and writes it to `react-native-sensitive-info` (iOS Keychain / Android Keystore-encrypted SharedPreferences) after effectively every action (`throttle` is 0). The blob holds full transaction histories, UTXO sets, NFT caches, XMTP message bodies, WalletConnect sessions and, per coin, up to 50 derived private keys. The JS thread runs two `JSON.stringify` passes over megabytes of state, copies the string to native, and a secure store designed for small secrets re-encrypts and rewrites it. That is the freeze. The same mechanism is documented in Trezor Suite issue #31540.
2. **The login password is stored in plaintext and wallet secrets are not protected by it.** `auth.password` is persisted verbatim; mnemonics and private keys sit in the same blob with `accessControl: 'none'`. Biometric unlock is a boolean flag that releases no secret.

### 0.1 Security counter-review of the request (as asked)

| Assumption in the request | Verdict | What the plan does |
|---|---|---|
| Move non-sensitive state off the keychain to local storage; keep only secrets in react-native-sensitive-info. | Right direction. But "non-sensitive" state still contains privacy-relevant data (addresses, balances, address book) and WalletConnect session keys. | Non-sensitive state → MMKV, and the MMKV file is itself AES-256 encrypted with a random key held in the secure store. Native, cheap, no UX cost. |
| "The login password should be properly encrypted." | Passwords are hashed, not encrypted, and the best practice for a local wallet is to **not store the password at all**: even a slow hash is an offline brute-force target. | The password derives a key that *unwraps* the vault key. "Correct password" = "AES-GCM unwrap authenticates". A boolean `hasAccount` replaces the "non-empty password" routing check. This is the MetaMask / Bitwarden model. |
| "Mnemonic and private key should be encrypted with the password." | Correct and standard. But encrypting the *whole* wallet object graph under the password would bring the freeze back. | Only true secrets go into a small encrypted vault written on wallet-structure changes only. Everything else is stripped at rest. |
| Implicit: platform secure storage alone is enough. | No. With `accessControl: 'none'`, any code running in the app context, or a rooted/jailbroken device, reads the keys. | Two independent layers (hardware-backed store **and** password-derived key). Biometrics = a hardware-bound third wrap of the same vault key, not a flag. |
| Implicit: these are the only two issues. | Exploration found six related defects. | Listed in §2.4 and folded into phases. |

### 0.2 Decisions taken with the user (2026-09-18)

- Secure store for small secrets: **keep `react-native-sensitive-info` 5.6.2** (already installed; Nitro-era rewrite; Android Keystore AES-256-GCM with StrongBox attempt; iOS Keychain; `biometryCurrentSet`/`devicePasscode` policies), wrapped in a `SecureStore` adapter so it can be swapped in one file.
- Password KDF: **PBKDF2-HMAC-SHA256, 600,000 iterations** (OWASP minimum; FIPS-friendly; same primitive as `hideWallet.js` and `googleDriveBackup.js`; MetaMask mobile uses PBKDF2 at 900k). Parameters travel in the envelope so they can be raised later without a migration.
- Include the **persisted-state slimming phase**.
- Plan document lives in the repo under `docs/superpowers/plans/`.
- **Migration is a first-class requirement**: existing wallets survive the upgrade with no user action and no data loss.

---

## 1. Research summary (verified)

### 1.1 Codebase facts

| Fact | Where |
|---|---|
| Single persist key `persist:root2`; storage = `redux-persist-sensitive-storage` → RNSI 5.6.2 with `keychainService: "myKeychain"`, `accessControl: 'none'`; no `throttle`, `version`, `migrate`, `timeout`. | `src/redux/store.js:37-115` |
| Persisted: `auth`, `wallets`, `settings`, `message`, `sellCrypto`, `addressBook`, `batchTransaction`, `notificationAlerts`, `customRpc`, `sentAddressHistory`, `schedulePayment`. Blacklisted: `currentTransfer`, `exchange`, `exchangeHistory`, `currency`, `walletConnect`, `extraData`, `cryptoProvider`, `coinSync`, `staking`. | `store.js:104-138` |
| Transforms: `walletsPersistTransform` (in: force `isHidden` for non-MANUAL relock; out: reset refresh flags + `currentWalletIndex→currentWalletClientId`), `schedulePaymentPersistTransform` (out: reset `isSubmitting`, `pendingSubmitCount`). Both whitelist by *slice name*. | `store.js:44-98` |
| `auth.password` plaintext; written by `signUpSuccess`/`logInSuccess`/`changePasswordSuccess`; `===` compared in 5 places. | `dok-wallet-blockchain-networks/redux/auth/authSlice.js:66-98`; `src/components/LoginComponent/index.js:145`; `src/screens/auth/VerifyLoginScreen/index.js:74`; `src/components/ModalConfirmTransaction/index.js:93`; `src/components/ModalFingerprintVerification/index.js:49`; `src/screens/auth/ChangePassword/index.js:31` |
| Routing uses non-empty `auth.password` as "has account". | `src/components/main.js:140`; `src/routers/router.js:108-134` |
| **Secret carriers in persisted state** (all must be vaulted): `allWallets[i].phrase`, `.privateKey`; `coins[j].privateKey`, `.extendedPrivateKey`, `.phrase` (addToken path); `coins[j].deriveAddresses[k].privateKey` (shape `{address, derivePath, privateKey, isCustom?}`; one custom entry may lack `derivePath`); `chain_existing_coin[chain].privateKey/.extendedPrivateKey` (**live signing source** when a coin lacks its own key); `walletData[sessionId][i].privateKey` (WalletConnect); `sellCrypto.requestDetails.selectedFromWallet` (whole wallet); `batchTransaction.transactions[walletId][i].coinInfo.privateKey`. | `walletsSlice.js:152-170, 241-350, 521-549, 2158-2247, 3453-3475, 3605-3616`; `service/wallet.service.js:159-193, 522-528`; `cryptoChain/index.js:76-99`; `src/components/WalletConnectRequestModal.js:239`; `sellCryptoSlice.js:12-28`; `batchTransactionSlice.js:242, 421-437` |
| Coin identity used by the codebase: `generateUniqueKeyForChain(coin)` = `${chain_name.toLowerCase()}_${SYMBOL}`. EVM derive lists are identical across all EVM coins. | `helper/index.js:109-111`; `walletsSlice.js:132-149, 437, 3506-3515, 3556-3570` |
| `refreshCoins` etc. rebuild coins via `getCoinSnapshot` → `getCoin(wallet.phrase, …)`; `resolveWallet` prefers `coin.privateKey`, then `chain_existing_coin`, then phrase; throws `'getCoin condition not found'` if none. Snapshots copy `privateKey`, `extendedPrivateKey`, `deriveAddresses`. So hydrated inputs give hydrated outputs; stripped inputs break refresh. | `walletsSlice.js:591-600`; `wallet.service.js:49-55, 161-200`; `cryptoChain/index.js:79-152` |
| `resetCoinsToDefaultAddressForPrivacyMode` runs on every load **before** unlock and copies `deriveAddresses[0].privateKey` onto the coin (undefined when stripped). Hydration must merge, never overwrite with `undefined`. | `main.js:302`; `walletsSlice.js:3046` |
| `setSelectedDeriveAddress` self-heals `privateKey` from `extendedPrivateKey` — needs xprv hydrated. | `walletsSlice.js:2636-2664` |
| Biometric = `react-native-fingerprint-scanner` boolean; sets `auth.fingerprintAuth`; releases nothing. | `LoginComponent/index.js:88-120` |
| Lock = UI modal over a fully hydrated store; background work needing secrets while locked: pending-tx sending/polling, refresh intervals, WalletConnect `session_request`, staking/exchange/coinSync/messages thunks. | `main.js:126, 255-296, 367-438`; `walletsSlice.js:1825`; `EVMChain.js:681`; `Transfer/index.js:630`; `TransactionDetails/index.js:148`; `service/walletconnect.js:144` |
| `ChangePassword` never enforces the current password on submit. | `ChangePassword/index.js:31-48` |
| WalletConnect approve signs without `ModalConfirmTransaction`; reads `walletData?.privateKey`. | `WalletConnectTransactionModal.js:416-441` |
| No `PersistGate`; `persistStore` callback + 500 ms timer → `walletConnect.isReduxStoreLoaded`; BootSplash hides on it. `store.js` builds the store synchronously at module evaluation, **before** the `App.js` Android migration effect runs (latent race). | `store.js:169-173`; `main.js:132-140, 293-345`; `MainApp.js`; `App.js:12-49` |
| Store import sites (runtime): `index.js:46` (require, headless), `MainApp.js:3`, `main.js:43`, `delete.js:4`, `ModalDeteletData/index.js:5`, `providers/LocalNotificationProvider.js:11` (rendered outside Provider), `screens/main/Wallets/index.js:67`, `Wallets/HideWallet/index.js:46`, `service/walletconnect.js:1` (module-level), `cryptoChain/chains/EVMChain.js:681` (lazy). Tests mocking it: `walletconnect.autoAnswers.test.js:48`, `walletconnect.unsupportedMethod.test.js:28`. | as cited |
| Headless notifee handler requires the store, waits for `persistor.bootstrapped`, reads `schedulePayment`, **does not sign**. | `index.js:36-95`; `schedulePaymentSlice.js:277` |
| redux-persist internals: per-slice `persistReducer` transforms receive each *field* as `key`; default 5 s `timeout` rehydrates `undefined` and then **overwrites storage with initial state**. | `node_modules/redux-persist/lib/{getStoredState.js:29-33, persistReducer.js:78-80, createPersistoid.js:14-99}` |
| Crypto precedents on `react-native-quick-crypto` 1.1.7: PBKDF2-SHA256 + `timingSafeEqual` (`src/utils/hideWallet.js`); PBKDF2 → AES-256-GCM `[16 salt][12 nonce][ct][16 tag]` (`src/utils/googleDriveBackup.js:243-397`). quick-crypto also exports native `scrypt`, `argon2`, `hkdf`. `crypto` is aliased to it in Babel and Metro. | as cited; `node_modules/react-native-quick-crypto/src/*.ts` |
| RNSI 5.6.2: iOS `kSecClassGenericPassword`, `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` when no access control; Android AES-256-GCM key in `AndroidKeyStore` (StrongBox first), ciphertext in `SharedPreferences("sensitive_info")`. `AccessControl` ∈ `secureEnclaveBiometry | biometryCurrentSet | biometryAny | devicePasscode | none`. Options `{keychainService, accessControl, authenticationPrompt}`. **Android shows BiometricPrompt on `setItem` for biometric-protected items**; has a "key invalidated" error code. `getItem` on a missing key throws on Android (pattern handled in `apiIntegrity.js:98-105`). | `node_modules/react-native-sensitive-info/{src/types.ts, ios/KeychainManager.swift:83-85, android/.../SecureStorage.kt:57-71, HybridSensitiveInfo.kt:145-165}` |
| Toolchain: `react-native-nitro-modules` ^0.36.5, New Arch on, minSdk 24, iOS 16.0, `allowBackup="false"` but no `dataExtractionRules`; no iOS data-protection entitlement. | `package.json`; `android/gradle.properties:35`; `ios/Podfile:14,20`; `AndroidManifest.xml:26` |
| Jest: quick-crypto → `node:crypto`; no RNSI/MMKV mocks; slice tests use `configureStore` + mocked `cryptoChain`/`wallet.service`. | `jest.config.js`; `jest.setup.js`; `redux/wallets/walletSlice.test.js` |
| Both variants share storage names from `.env`; isolation is by bundle-id sandbox only. | `src/utils/wlData.js`; `.env` |

### 1.2 External references

- OWASP MASVS-STORAGE-1/2, MASVS-CRYPTO-1/2 — https://mas.owasp.org/MASVS/
- OWASP Password Storage Cheat Sheet — PBKDF2-HMAC-SHA256 ≥ 600,000; Argon2id m=19 MiB/t=2/p=1; unique salt; in-place upgrade of legacy parameters — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- MetaMask mobile `app/core/Encryptor` (PBKDF2 5k → 600k → 900k with versioned `keyMetadata` in the envelope, re-encrypt on unlock when stale; primitives via react-native-quick-crypto) and `SecureKeychain` (biometric item: `WHEN_UNLOCKED_THIS_DEVICE_ONLY` + `BIOMETRY_CURRENT_SET`) — https://github.com/MetaMask/metamask-mobile
- Trezor Suite #31540 — same freeze mechanism, fixed with `throttle`, `persistor.flush()` on background, smaller persisted graph — https://github.com/trezor/trezor-suite/issues/31540
- react-native-mmkv v4 (Nitro, RN ≥ 0.76, synchronous JSI; `createMMKV({id, encryptionKey, encryptionType:'AES-256'})`; redux-persist adapter in `docs/WRAPPER_REDUX.md`; Jest auto-mock; npm 4.3.2) — https://github.com/mrousavy/react-native-mmkv . **Encryption key is a string of at most 32 bytes** (native check); a hex-encoded 32-byte key (64 chars) throws.
- Android Keystore biometric-bound keys invalidate on enrollment change (`KeyPermanentlyInvalidatedException`); catch, delete, fall back to password — https://developer.android.com/privacy-and-security/keystore
- react-native-keychain 10.x docs reviewed for comparison only — https://oblador.github.io/react-native-keychain/

---

## 2. Threat model & requirements

### 2.1 Assets
A1 mnemonics · A2 imported private keys · A3 derived private / extended-private keys · A4 login password · A5 WalletConnect session keys · A6 addresses, balances, history, address book.

### 2.2 Adversaries
T1 backup/file extraction (incl. forensic image of a locked device) · T2 malicious code inside the app process · T3 rooted/jailbroken device reading the platform store · T4 physical attacker with the unlocked phone · T5 offline brute force of a weak password.
Out of scope: live kernel-level memory access while unlocked; compromised app binary.

### 2.3 Requirements
- **R1** A1–A3 at rest are encrypted under a password-derived key **and** kept in a hardware-backed store; defeating one layer is insufficient. (T1–T3)
- **R2** A4 is never stored in any form; correctness is proven by authenticated decryption. (T1, T3, T5)
- **R3** KDF cost ≥ OWASP baseline and upgradeable in place. (T5)
- **R4** Biometric unlock releases key material bound to the current biometric set; enrollment change invalidates it and falls back to password. (T4)
- **R5** Non-sensitive state is encrypted on disk and excluded from OS backup. (T1)
- **R6** No secret reaches MMKV, logs, Sentry or Drive backup unintentionally; one shared field list plus tests enforce it. (T2)
- **R7** Existing users migrate with zero data loss, idempotently; the legacy blob is retained until the new store is proven end-to-end.
- **R8** Every `===` password check becomes a vault unwrap; `ChangePassword` verifies the current password.
- **R9** Persist writes stop blocking the JS thread: target p95 serialise+write < 16 ms for the largest slice on a mid-range Android, measured with a dev-only timing breadcrumb before and after.

### 2.4 Related defects found (folded in)
D1 `ChangePassword` skips current-password check (Phase 3). D2 WalletConnect approve bypasses `ModalConfirmTransaction` (note only; separate ticket). D3 `selectedFromWallet` and `coinInfo.privateKey` persist secrets (Phase 2). D4 wallet reset never deletes the secure item (Phase 2). D5 no `dataExtractionRules` / iOS data-protection entitlement (Phase 5). D6 screenshot guard missing on `CustomDerivation` and `Login` (Phase 5).

---

## 3. Target architecture

### 3.1 Storage layout

```
TIER 0  react-native-sensitive-info   service = SECURE_STORE_KEYCHAIN_NAME (new .env key)
  storage.mmkvKey       32-char random ASCII key for MMKV            accessControl:'none'
  vault.dek.password    {v, kdf:{alg,iterations,salt}, iv, ct, tag, aad}   'none'
  vault.dek.biometric   raw DEK (base64)                              'biometryCurrentSet' (optional)
  vault.blob            {v, iv, ct, tag, aad}  = AES-256-GCM(DEK, vaultJSON)   'none'
  (unchanged) integrity_* keys under "myKeychain"
  (legacy)    persist:root2 under "myKeychain" — read once; deleted at finalize

TIER 1  MMKV instance id 'dok.state'  (AES-256, key = storage.mmkvKey)
  persist:auth  persist:wallets  persist:settings  persist:message  persist:sellCrypto
  persist:addressBook  persist:batchTransaction  persist:notificationAlerts  persist:customRpc
  persist:sentAddressHistory  persist:schedulePayment      — one redux-persist envelope per slice, no secrets
  storage.schemaVersion  storage.migratedAt  storage.legacyRetainedAt

TIER 2  (Phase 4, optional) MMKV instance 'dok.cache', unencrypted, re-fetchable data only
```

Why `vault.blob` lives in the secure store and not MMKV: defence in depth (hardware key **and** password), matches the user's preference, size is bounded (tens of KB per wallet) and it is written only on wallet-structure changes, never on balance refresh.

### 3.2 Key hierarchy

```
password ──PBKDF2-HMAC-SHA256(600 000, salt 32 B)──▶ KEK_pw ──AES-256-GCM wrap──▶ vault.dek.password
random 32 B = DEK ──AES-256-GCM──▶ vault.blob
DEK (raw) ──stored under biometryCurrentSet──▶ vault.dek.biometric   (only when Settings › fingerprint is on)
```

- **DEK**: `crypto.randomBytes(32)`. Held in a module-scoped variable inside `src/security/vault.js` while unlocked; never in Redux, never logged.
- **KEK_pw**: derived per unlock via the async native `pbkdf2` (callback form as in `hideWallet.js:31-48`; never `pbkdf2Sync`). Never stored. Password change = derive new KEK, re-wrap DEK; blob untouched.
- **Password verification** = unwrap succeeds (GCM tag). Nothing to compare, constant-time by construction.
- **Biometric**: raw DEK under `accessControl: 'biometryCurrentSet'` with `authenticationPrompt`. Reading shows the OS prompt (iOS Secure Enclave-gated Keychain; Android Keystore key with `setUserAuthenticationRequired(true)`). Enrollment change → RNSI "key invalidated" error → delete the item, fall back to password, re-create after the next password unlock (Settings toggle stays on). **Android prompts on write too**, so the biometric copy is never created silently during migration on Android (see §7 step 7).
- **MMKV key**: `randomBytes(24).toString('base64')` = exactly 32 ASCII chars (192-bit entropy), satisfying MMKV's ≤ 32-byte string limit with `encryptionType: 'AES-256'`. Stored with `'none'` so the state store opens before login and inside the Android headless task (Keystore keys without user-auth are usable while the screen is locked; iOS has no background notifee delivery, so its "when unlocked" accessibility is irrelevant).

### 3.3 Envelopes (base64 fields)

`vault.dek.password`:
```json
{ "v": 1, "kdf": { "alg": "pbkdf2-sha256", "iterations": 600000, "salt": "<32B>" },
  "cipher": "aes-256-gcm", "iv": "<12B>", "ct": "<32B>", "tag": "<16B>", "aad": "dok.dek.password.v1",
  "createdAt": 0, "updatedAt": 0 }
```
`vault.blob`: `{ "v": 1, "cipher": "aes-256-gcm", "iv": "<12B>", "ct": "…", "tag": "<16B>", "aad": "dok.vault.v1" }`

Vault plaintext v1:
```json
{ "v": 1,
  "wallets": { "<clientId>": {
      "phrase": "…",                                   // mnemonic wallets
      "privateKey": "…",                               // private-key imports
      "coins":         { "<coinKey>": { "privateKey": "…", "extendedPrivateKey": "…", "phrase": "…" } },
      "chainExisting": { "<chain>":   { "privateKey": "…", "extendedPrivateKey": "…" } },
      "deriveKeys":    { "<family>":  { "<derivePath|address>": "<privateKey>" } } } } }
```
- `coinKey` = `generateUniqueKeyForChain(coin)` (`helper/index.js:109`), the identity the codebase already treats as unique; `_id` recorded alongside for diagnostics only.
- `family` = `'evm'` when `isEVMChain(chain_name)`, else `chain_name` — EVM derive lists are identical across EVM coins, so this avoids 50 keys × every EVM token. Hydration writes each entry back to every coin whose `deriveAddresses[k]` matches by `derivePath` (fallback `address`).
- Fresh 12-byte IV per encryption; AAD binds ciphertext to purpose (a DEK wrap can never be replayed as a blob); KDF params in the envelope let the unlock path detect stale parameters and re-wrap with current ones (MetaMask pattern).

### 3.4 In-memory model after unlock

Chain code, thunks and selectors keep reading `wallet.phrase`, `coin.privateKey`, `chain_existing_coin[*].privateKey`, `deriveAddresses[*].privateKey` from the Redux `wallets` slice **in memory** — unchanged in Phase 2. `hydrateWalletSecrets(payload)` (new reducer) merges vault contents back onto wallet/coin objects (merge only; never overwrite an existing value with `undefined`). A field-level persist transform strips every field in the shared constant `SECRET_WALLET_FIELDS` on write. `extractVaultPayload(allWallets)` and `hydrateWalletSecrets` are inverses (property test in §9).

Vault sync: RTK `createListenerMiddleware` (RTK ^2.10.1 present) with `predicate: action.type.startsWith('wallets/') && cur.wallets.allWallets !== prev.wallets.allWallets`; extracts the payload, compares to the last-written payload string, debounces 500 ms, then `vault.saveSecrets(payload)`. `resetWallet` → `vault.destroy()`. Guard: non-empty payload while `!vault.isUnlocked()` → `captureError` tag `vault.write_while_locked`. Force-flush on background alongside `persistor.flush()`.

---

## 4. Libraries

| Package | Action | Notes |
|---|---|---|
| `react-native-mmkv` | **add** `4.3.x` | Nitro; peer `react-native-nitro-modules` (present). iOS `pod install`; Android nothing structural. Jest uses the library's in-memory mock, plus our own for key-length assertions. |
| `react-native-sensitive-info` | **pin exact** `5.6.2` | Behind `src/security/secureStore.js`. Drop the caret so a minor bump cannot change native storage semantics again (this already forced the `App.js` migration once). |
| `redux-persist-sensitive-storage` | **remove** in Phase 3 | The legacy reader calls RNSI directly. |
| `react-native-quick-crypto` | keep `1.1.7` | PBKDF2, AES-256-GCM, randomBytes, timingSafeEqual. |
| `react-native-fingerprint-scanner` | keep | Still used for `isSensorAvailable`/name and as the in-session confirmation gate. Unlock-by-biometric moves to the secure-store read (OS prompt). Removal is a Phase 5 option. |
| `redux-persist` | keep `6.0.0` | Per-slice `persistReducer`, `throttle: 1000`, `timeout: 0`, `version: 1` + `createMigrate` stub. |

CI (`codemagic.yaml`): no changes beyond existing `yarn install` / `pod install`. New `.env` key `SECURE_STORE_KEYCHAIN_NAME` (add to `.env.example` and the Codemagic `common` group). Both variants may share the value (separate sandboxes).

---

## 5. Bootstrap, per-slice persistence and strip/hydrate design

### 5.1 Bootstrap — keep `store`/`persistor` synchronous; make the *storage adapter* async-ready
redux-persist's storage interface is promise-based, so readiness lives inside the adapter and none of the 10 import sites change.

New files:
- `src/redux/storage/bootstrap.js` — `bootstrapStorage()` memoised promise; `getMMKV()`.
- `src/redux/storage/mmkvStorage.js` — redux-persist `Storage` whose `getItem/setItem/removeItem` `await bootstrapStorage()` then call the synchronous MMKV API (per `docs/WRAPPER_REDUX.md`).
- `src/redux/storage/wipe.js` — `wipeAllLocalData()`.
- `src/redux/storage/migrateLegacyRoot2.js` — the migrator (§7).

Order inside `bootstrapStorage()`:
1. Android legacy SharedPreferences migration — move the body of `App.js:16-40` here verbatim (keep the `sensitive_info_migration` AsyncStorage flag). This also fixes the latent race where `store.js` fired `getStoredState` before that effect ran.
2. MMKV key: `secureStore.get('storage.mmkvKey')` (try/catch; Android throws on missing). If missing → `randomBytes(24).toString('base64')`, `set`.
3. `createMMKV({id: 'dok.state', encryptionKey, encryptionType: 'AES-256'})`.
4. Schema check: `storage.schemaVersion` < 2 and legacy `persist:root2` present → run the migrator to completion.
5. Resolve.

`App.js` becomes: `useEffect(() => bootstrapStorage().then(() => setReady(true), onFatal))`; render `<View/>` until ready (BootSplash stays up until `isReduxStoreLoaded` anyway). On fatal (corrupt legacy, secure store unavailable) render a blocking storage-error screen (reuse the `DisableComponent` slot in `main.js:398`) — never fall through to an empty store, which would route a funded user to onboarding.

Headless (`index.js`): `require('./src/redux/store')` triggers the same memoised bootstrap in the same JS runtime. Steps 2–4 need no Activity (`'none'` items never prompt; Nitro has no UI dependency). Before first device unlock since boot, Keystore access throws → bootstrap rejects → the handler's existing `try/catch` (`index.js:80-84`) swallows it, same behaviour as today. Migration may run headless (idempotent); breadcrumb `context: 'headless'`.

`persistStore` configs must set **`timeout: 0`** on every slice (default 5 s would rehydrate `undefined` after a slow bootstrap + PBKDF2 and overwrite storage with initial state — `persistReducer.js:78-80`).

### 5.2 Per-slice persist layout
Replace `persistCombineReducers` (`store.js:117-139`) with `combineReducers` where the 11 persisted slices are wrapped in `persistReducer(makePersistConfig(slice, opts), slice.reducer)` and the 9 blacklisted slices stay plain. `makePersistConfig` → `{key: slice.name, storage: mmkvStorage, timeout: 0, throttle: 1000, version: 1, migrate: createMigrate({1: s => s}), blacklist, transforms}`. Keys become `persist:auth`, `persist:wallets`, ….

**Transform semantics change:** with per-slice `persistReducer`, transforms receive each slice *field* as `key`. Existing whitelist-by-slice-name transforms are rewritten field-level:

| Slice | Field-level rules |
|---|---|
| `auth` | `blacklist: ['password', 'loading', 'error']`; new persisted key `hasAccount` (§6). Keep `isLogin`, `fingerprintAuth`, `attempts`, `maxAttempt`, `lastAttempt`, `lastUpdateCheckTimestamp`. |
| `wallets` | in (`allWallets`): force `isHidden` for non-MANUAL relock (from `store.js:44-52`) **then** `stripWalletSecrets`. out: `isRefreshingAllWallets→false`, `refreshingWalletClientId→null`, `refreshCoinsRequestIds→{}`. The `currentWalletIndex→currentWalletClientId` fix moves into the one-shot migrator (it needs two fields at once). |
| `schedulePayment` | out: `isSubmitting→false`, `pendingSubmitCount→0`. |
| `sellCrypto` | in (`requestDetails`): `selectedFromWallet → stripWalletSecrets(...)`. Change `sellCryptoSlice.js:71` to resolve the live wallet by `clientId` from `state.wallets.allWallets`, falling back to the stored stub. |
| `batchTransaction` | in (`transactions`): delete `coinInfo.privateKey`. Grep showed no reader of `coinInfo.privateKey` (readers use `chain_name`, `address`, `symbol`; send path uses `getNativeCoin` on the live coin). |
| others | plain. |

These keep in-flight flags inside their own slice and reset them in that slice's transform (user rule); `password` is removed rather than repurposed and `hasAccount` is a **new** key (user rule).

**Rehydration / routing flash:** wrap `<Main/>` in redux-persist `PersistGate loading={null}` inside `Provider` (`MainApp.js:52-56`). `bootstrapped` flips once all 11 keys rehydrate (consecutive microtasks after the bootstrap resolves), so `useRoute(hasAccount)` never renders with a pre-rehydration value. Keep `setReduxStoreLoaded` for BootSplash and side effects as is.

**Purge/reset:** `wipeAllLocalData()` replaces `persistor.purge()` at `ModalDeteletData/index.js:18` and `delete.js:10`: `persistor.purge()` → `mmkv.clearAll()` → `vault.destroy()` (deletes `vault.blob`, `vault.dek.password`, `vault.dek.biometric`) → delete legacy `persist:root2` if present → delete `storage.mmkvKey` (fresh key after `RNRestart`). `resetWallet` callers (`ModalReset/index.js:73`, `authSlice.js:30` in `handleAttempts`) are covered by the listener (`resetWallet → vault.destroy()`), and `logOutSuccess` sets `hasAccount=false` so routing returns to `CarouselCards` as today.

### 5.3 `SECRET_WALLET_FIELDS` and strip/hydrate
New `dok-wallet-blockchain-networks/redux/wallets/walletSecrets.js` exporting `SECRET_WALLET_FIELDS`, `stripWalletSecrets(wallet)`, `extractVaultPayload(allWallets)`, `assertNoSecrets(obj)`; `walletsSlice` gains `hydrateWalletSecrets`. `src/services/logger/scrub.js` imports the same constant.

Strip (per wallet): `phrase`, `privateKey`; `coins[*].privateKey|extendedPrivateKey|phrase`; `coins[*].deriveAddresses[*].privateKey`; `chain_existing_coin[*].privateKey|extendedPrivateKey`; `walletData[*][*].privateKey`. Keep: `publicKey`, `extendedPublicKey`, `address`, `accountId`, `hideSettings.*` (PBKDF2 hash + salt only).

Hydrate: merge by `clientId` → `coinKey` → `derivePath ?? address`; `chainExisting` by chain; `walletData[*][*].privateKey` is **not** re-hydrated — instead change `WalletConnectTransactionModal.js:432` to look up the live coin's key by `chain_name` + `address`.

Reducers that rebuild coin objects (none strip; all preserve their inputs, so they are safe while hydrated): `setCoinsInCurrentWallet` 2404, `updateContractAddress` 2475, `setSelectedDeriveAddress` 2636, `updateCurrentCoin` 2684, `deleteDeriveAddressInCurrentCoin` 2697, `deleteMultipleDeriveAddressesInCurrentCoin` 2747, sort/rearrange 2818-2931, `resetCoinsToDefaultAddressForPrivacyMode` 3046, `removeEVMDeriveAddresses` 3069, `addCoinsToWallet` 3184, `refreshCoins.fulfilled` 3255, `syncCoinsWithServer.fulfilled` 3289, `refreshCurrentCoin.fulfilled` 3312, `addOrToggleCoinInWallet.fulfilled` 3369, `addCoinGroup.fulfilled` 3391, `addToken.fulfilled` 3426, `createWalletsBatch.fulfilled` 3438, `createWallet.fulfilled` 3453, `addEVMAndTronDeriveAddresses.fulfilled` 3486, `add50AddressesOnCurrentCoin.fulfilled` 3540, `addCustomDeriveAddress.fulfilled` 3578 (all in `walletsSlice.js`).

---

## 6. Vault module and UI flow changes

### 6.1 `src/security/vault.js` API
`createVault(password)` · `unlockWithPassword(password) → payload` · `unlockWithBiometric() → payload` · `verifyPassword(password)` (unwrap only) · `changePassword(current, next)` (re-wrap DEK only) · `enableBiometric()` / `disableBiometric()` · `saveSecrets(payload)` · `destroy()` · `isUnlocked()` · `lock()` · `getKdfParams()`. Crypto primitives in `src/security/vaultCrypto.js`; secure-store I/O in `src/security/secureStore.js` (`get/set/remove(key, {accessControl, authenticationPrompt})`, fixed `keychainService`).

### 6.2 File-by-file changes
- `authSlice.js:66-98` — add `hasAccount: false`; `signUpSuccess` → `hasAccount = true` (ignore payload); `logInSuccess`/`changePasswordSuccess` stop writing the password; `logOutSuccess` → `hasAccount = false`. `authSelectors.js` — add `getHasAccount`, delete `getUserPassword`; fix every consumer below (grep after deletion catches stragglers, e.g. Drive backup/restore modals).
- `src/components/main.js:140` — `useRoute(hasAccount)`.
- `LoginComponent/index.js:145-176` — `try { payload = await vault.unlockWithPassword(pw); dispatch(hydrateWalletSecrets(payload)); await finalizeLegacyMigrationIfNeeded(); } catch { existing handleAttempts path }`. Fingerprint path `:88-102`: if `vault.dek.biometric` exists → `vault.unlockWithBiometric()` (RNSI's own prompt) **instead of** `FingerprintScanner.authenticate` (no double prompt); if it does not exist and `settings.fingerprint` is on (Android right after migration) → skip auto-biometric once, show the password field with a one-line notice, and after that password unlock call `vault.enableBiometric()` (a prompt here is expected).
- `VerifyLoginScreen/index.js:74`, `ModalConfirmTransaction/index.js:93` — `await vault.verifyPassword(pw)`; their fingerprint branches remain app-level gates (secrets already in memory).
- `ModalFingerprintVerification/index.js:49-56` — `verifyPassword` → `enableBiometric()` → `updateFingerprint(true)`.
- `Settings/index.js:73-78` (toggle off) — `vault.disableBiometric()`.
- `ChangePassword/index.js:31-48` — `await vault.changePassword(current, next)`; catch → `setWrong(true)` (fixes D1).
- `RegistrationScreen/index.js:26-33` — `await vault.createVault(pw)` then `signUpSuccess()`; the later `createWallet` triggers the listener write.
- `ModalReset/index.js:73-82`, `authSlice.js:30` — no direct change (listener + `logOutSuccess`).
- `ModalDeteletData/index.js:18`, `delete.js:10` — `wipeAllLocalData()`.
- `WalletConnectTransactionModal.js:432` — key from the live coin, not persisted `walletData`.
- `sellCryptoSlice.js:71` — resolve live wallet by `clientId`.
- Drive backup/restore (`BackupWallets.js`, `RestoreWallets.js:226,307`, `googleDriveBackup.js:411`) — anywhere the typed password is compared to the store → `vault.verifyPassword`.

### 6.3 Lock behaviour
**Phase 2 keeps secrets in memory while the lock modal shows** (current behaviour). Zeroising now would break: pending-tx sending/polling (`walletsSlice.js:1825`, `EVMChain.js:681`), refresh intervals (`Transfer/index.js:630`, `TransactionDetails/index.js:148`), WalletConnect `session_request` signing, staking/exchange/coinSync/messages thunks, Drive backup. Zeroise-on-lock is Phase 5 and requires an `isUnlocked` gate in `getCoin`/`getNativeCoin` plus queueing of those callers. Scheduled-payment reminders do not sign, so headless is unaffected either way.

---

## 7. Migration (R7) — `migrateLegacyRoot2.js`

State machine on MMKV `storage.schemaVersion`: **absent/0** + legacy blob → migrate · **2** = MMKV slices + vault written, legacy retained · **3** = legacy deleted (finalised). `schemaVersion = 2` is the **last** write of the migration, so a kill anywhere before it causes a full, clean redo from the untouched legacy blob (MMKV writes are atomic per key).

Steps:
1. `secureStore.get('persist:root2', service "myKeychain")`. Parse outer JSON `{auth: "...", wallets: "...", …, _persist: "..."}`; `JSON.parse` each inner value (format per `createPersistoid.js:77-98`).
2. `password = auth.password`. Apply the legacy `currentWalletIndex→currentWalletClientId` fix (from `store.js:64-81`).
3. If `password` non-empty: `dek = randomBytes(32)`, `salt = randomBytes(32)`, `kek = pbkdf2(password, salt, 600000, 32, 'sha256')`; write `vault.dek.password` and `vault.blob = AES-256-GCM(dek, JSON(extractVaultPayload(wallets.allWallets)))`.
4. For each of the 11 slices write `persist:<slice>` = `JSON.stringify({ [field]: JSON.stringify(value)…, _persist: JSON.stringify({version: 1, rehydrated: true}) })` with secrets stripped (wallets; `sellCrypto.requestDetails.selectedFromWallet`; `batchTransaction…coinInfo.privateKey`). `auth` written as `{…auth minus password/loading/error, hasAccount: !!password}`.
5. **Self-verify**: read back `persist:wallets`, compare the `clientId` set and per-wallet coin counts with legacy; unwrap DEK with `password`, decrypt blob, `deepEqual(decrypted, extractVaultPayload(legacyWallets))`.
6. Write `storage.schemaVersion = 2`, `storage.migratedAt`, `storage.legacyRetainedAt`.
7. iOS only, if `settings.fingerprint === true`: create `vault.dek.biometric` now (Keychain write does not prompt). Android: deferred to the first password unlock (§6.2).
8. **Finalise (2 → 3)** in `LoginComponent` after the first successful `unlockWithPassword` or `unlockWithBiometric` — the true end-to-end proof: re-run step 5's comparison against the hydrated store, then delete `persist:root2`, set `schemaVersion = 3`.

Edge cases:
- **Killed mid-migration** — covered by last-write ordering.
- **Legacy present, `auth.password` empty** (onboarding incomplete or post-Forgot): migrate non-secret slices, `hasAccount = false`, no vault. If `allWallets` is non-empty anyway (should be impossible since `resetWallet` runs in those flows): keep the legacy blob, hydrate legacy secrets into memory for this session, let `RegistrationScreen`'s `createVault` + listener persist them; Sentry tag `migration.orphan_wallets=true`.
- **Legacy missing, MMKV present** — normal; if `schemaVersion` missing but `persist:*` keys exist, treat as 2 (never wipe).
- **Both present** — `schemaVersion` decides.
- **Corrupt legacy JSON** — `captureError` tag `migrate.step=parse`, leave legacy untouched, blocking error screen. Never continue into an empty store.
- **Private-key-import wallets** — `phrase` absent; all vault fields optional; `syncCoinsWithServer` skips them (`walletsSlice.js:769`).
- **Hidden wallets** — `hideSettings` copied as-is; `isHidden` already correct in the legacy blob.
- **`extraData`** — blacklisted; unchanged.
- **Downgrade** — before finalise an older build still reads `persist:root2`; after `schemaVersion 3` it starts fresh. Call out in release notes; consider keeping finalise behind a 7-day grace period if support wants a downgrade window.
- **KDF cost** — one 600k PBKDF2 at migration and one per password unlock; expect ~0.5–2 s on low-end Android via native async `pbkdf2`. Measure on the slowest supported device (QA item o). Fallback if unacceptable: 310k (OWASP's SHA-512 floor equivalent), recorded in the envelope.

Telemetry (values never): breadcrumbs `storage.migration` `{step, wallets, coins, deriveKeys, kdfMs, totalMs, context}`; Sentry tag `storage.schema`; `captureError(e, {tags: {area: 'storage', op: 'migrate', step}})`; `logger.info('storage.migrated', counts)`.

---

## 8. Phases (each independently shippable; TDD per task)

**Phase 1 — Foundations (no behaviour change yet)**
- Add `react-native-mmkv`; pin RNSI `5.6.2`; add `SECURE_STORE_KEYCHAIN_NAME`.
- `src/security/secureStore.js`, `src/security/vaultCrypto.js`, `src/security/vault.js` with full unit tests (§9.1).
- `walletSecrets.js` (`SECRET_WALLET_FIELDS`, strip/extract/hydrate/assertNoSecrets) + property tests (§9.2); `scrub.js` imports the constant.
- `bootstrap.js`, `mmkvStorage.js`, dev-only persist timing breadcrumb (`serialize` wrapper) to capture the *before* baseline on the current store.

**Phase 2 — Engine swap + vault + migration (the release that fixes both issues)**
- `store.js`: per-slice `persistReducer`, field-level transforms, `throttle: 1000`, `timeout: 0`, `PersistGate` in `MainApp.js`, `persistor.flush()` + vault flush on background (`main.js` lifecycle handler).
- Vault listener middleware; `hydrateWalletSecrets` reducer.
- `migrateLegacyRoot2.js` + finalise hook; `App.js` bootstrap gate and error screen.
- `auth.hasAccount`; all §6.2 UI changes (Login, Verify, Confirm, Fingerprint, ChangePassword, Registration, WC modal, sellCrypto, Drive backup/restore).
- `wipeAllLocalData()`; remove `redux-persist-sensitive-storage`.
- Ship behind a staged rollout; monitor `storage.migration` and `dokapi`-independent crash rate.

**Phase 3 — Cleanup**
- Delete legacy Android migration code once `sensitive_info_migration` + `schemaVersion 3` coverage is ~100 % (one release later).
- Remove `getUserPassword` remnants, dead `getIsLocked` selector.

**Phase 4 — Slimming (R9, user-approved)**
- `wallets` transform: persist at most the 200 most recent `coins[*].transactions` (full list stays in memory; refresh refetches); do not persist `nft` and `walletData` (rebuilt from sessions on demand); keep `deriveAddresses` (addresses only) and `UTXOs` (needed for offline coin selection).
- Consider moving `message` (XMTP) bodies to the unencrypted `dok.cache` MMKV with a size cap; `sentAddressHistory` already capped.
- Re-measure with the Phase 1 breadcrumb; compare against baseline.

**Phase 5 — Hardening (optional, separate approvals)**
- Zeroise secrets on lock (`isUnlocked` gate in `getCoin`/`getNativeCoin`, callers queue until unlock).
- Android `dataExtractionRules` (exclude MMKV dir and `sensitive_info` prefs from cloud backup and device transfer); iOS `default-data-protection` entitlement `NSFileProtectionComplete`.
- Screenshot guard on `CustomDerivation` and `Login`; route WalletConnect approve through `ModalConfirmTransaction` (D2).
- Re-wrap on unlock when `kdf.iterations < CURRENT` (parameter upgrade path).
- Replace `react-native-fingerprint-scanner` with RNSI biometric reads everywhere.

---

## 9. Verification

### 9.1 Jest mocks (`jest.setup.js`)
- `react-native-mmkv`: `createMMKV(opts)` → `Map`-backed object with `getString/set/remove/contains/getAllKeys/clearAll`, registry by `id`; **throw if `opts.encryptionKey.length > 32`**.
- `react-native-sensitive-info`: `Map` keyed by `${keychainService}::${key}`; `getItem` rejects on missing key when `Platform.OS === 'android'`; biometric-policy `setItem`/`getItem` increment a `promptShown` counter; a helper to simulate "key invalidated".
- Existing quick-crypto → `node:crypto` mock already covers PBKDF2, AES-GCM, randomBytes, timingSafeEqual.

### 9.2 Unit tests
1. `vault.test.js` — round-trip; wrong password fails by GCM auth (not compare); tampered ct/tag fails; `changePassword` leaves `vault.blob` byte-identical; kdf params persisted; `enableBiometric`/`disableBiometric` add/remove only that item; invalidated biometric item → password fallback path.
2. `walletSecrets.test.js` — `hydrate(strip(w), extract(w))` deep-equals `w` for fixtures: mnemonic wallet with ETH+USDT+BTC (50 EVM derive entries incl. one custom without `derivePath`, `chain_existing_coin` with xprv), private-key import wallet, wallet with WalletConnect `walletData`. `strip` output passes `assertNoSecrets` (keys in `SECRET_WALLET_FIELDS`; values matching 64-hex, WIF `^[5KL9c]`, 12/18/24-word phrases).
3. `migrateLegacyRoot2.test.js` — fixture `persist:root2` in legacy envelope; asserts `persist:<slice>` keys and envelope shape, `_persist.version === 1`, `auth.hasAccount === true` with no `password`, `currentWalletIndex` converted, `selectedFromWallet`/`coinInfo` stripped, vault decrypts to `extract(legacyWallets)`, `schemaVersion === 2`, legacy still present; idempotency (run twice → identical); kill simulation (throw after vault write, rerun → clean); empty-password path; corrupt JSON → throws, nothing written.
4. `store.persist.guard.test.js` — real `rootReducer` with mocked storage; dispatch `createWallet.fulfilled`, `addToken.fulfilled`, `add50AddressesOnCurrentCoin.fulfilled`, `setWalletConnectWalletData` with secret-bearing fixtures; `await persistor.flush()`; `assertNoSecrets` over every MMKV value; outbound transforms reset in-flight flags.
5. `vaultListener.test.js` — after those actions `vault.blob` was written and decrypts to `extract(state)`; `resetWallet` deletes all three vault items.
6. Existing `walletconnect.*.test.js` mocks of `redux/store` stay valid (exports unchanged).
7. `npx jest` full run stays green (known-failing Solana/Hedera ESM suites excepted, per memory).

### 9.3 Manual QA matrix
iOS + low-end Android × dokwallet + kimlwallet. Upgrade from the current release build with: (a) 3 mnemonic wallets incl. 50 EVM/TRX/SOL derive addresses and a custom derivation; (b) a private-key-import wallet; (c) a hidden wallet (RELAUNCH and MANUAL relock); (d) fingerprint on / off; (e) onboarding never completed; (f) force-kill during first launch after upgrade, before and after splash; (g) Delete-all-data and Forgot flows, then re-onboard; (h) Change password, relaunch; (i) scheduled-payment reminder delivered while the app is killed (Android headless, screen locked); (j) persisted WalletConnect session survives and signs after upgrade; (k) Drive backup then restore; (l) install the previous build before finalise (must still open) and after (starts fresh, documented); (m) airplane mode during first launch; (n) send one transaction per chain family after upgrade (proves derive keys + xprv hydration); (o) unlock latency with 600k iterations on the slowest device; (p) biometric enrollment change → password fallback → biometric re-enabled after unlock.

### 9.4 Performance evidence (R9)
Dev-only `serialize` wrapper records `{slice, bytes, ms}` breadcrumbs; capture before (Phase 1 on current store) and after (Phase 2, Phase 4) on the same device and wallet set; include the numbers in the PR description.

---

## 10. Open items to confirm during implementation
- Exact MMKV max key length in the installed 4.3.x native check (plan assumes 32 bytes; the 24-byte-base64 key satisfies any limit ≥ 32).
- Whether MMKV/Nitro initialises in Android headless JS with no Activity (verify on device; fallback is to skip the bootstrap in headless when it throws, matching today's behaviour).
- Whether BTC `deriveAddresses` entries always carry `privateKey` or are sometimes watch-only (affects the self-heal path at `walletsSlice.js:2655-2664`; xprv hydration covers it).
- Exact RNSI option field names for the biometric prompt (`authenticationPrompt: {title, subtitle}` per `types.ts:329-333`).
- Whether product wants a downgrade grace period before finalise (§7 step 8).

## 11. Critical files
- `src/redux/store.js` — rewrite persistence composition.
- `dok-wallet-blockchain-networks/redux/wallets/walletsSlice.js` — `hydrateWalletSecrets`; no other reducer changes.
- `dok-wallet-blockchain-networks/redux/wallets/walletSecrets.js` — **new**.
- `dok-wallet-blockchain-networks/redux/auth/authSlice.js`, `authSelectors.js` — `hasAccount`.
- `src/security/{secureStore,vaultCrypto,vault}.js` — **new**.
- `src/redux/storage/{bootstrap,mmkvStorage,migrateLegacyRoot2,wipe}.js` — **new**.
- `App.js`, `src/components/MainApp.js`, `src/components/main.js`, `index.js`.
- `src/components/LoginComponent/index.js`, `VerifyLoginScreen`, `ModalConfirmTransaction`, `ModalFingerprintVerification`, `ChangePassword`, `RegistrationScreen`, `ModalDeteletData`, `delete.js`, `WalletConnectTransactionModal.js`, `sellCryptoSlice.js`, Drive backup/restore screens.
- `jest.setup.js`, new test files listed in §9.2; `.env.example`, `codemagic.yaml` env group, `CLAUDE.md` architecture note.
