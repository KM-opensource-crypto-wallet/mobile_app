# Fixed Sentry issues

As of 23 Oct 2026. Only issues with a fix in the code are listed here.

| Issue | Level | Events / users | Status |
| --- | --- | --- | --- |
| [DOKWALLET-K](https://kiml-view-ltd.sentry.io/issues/7807143343/) | fatal | 9 / 1 person (3 installs) | Fix implemented on `divyang/fixes-shell-vul`. Not yet committed, built on device or released. |

## DOKWALLET-K: locked out after moving to a new iPhone

`SecureStoreError: [E_INTEGRITY_VIOLATION] Tampering detected for key "…" in service "dokwallet.vault"`

### What happened

One user moved to a new iPhone (iPhone19,2, iOS 27.0, app 2.53 (1)) with Quick Start or an encrypted computer backup. On every launch the app stopped at "Storage problem — Code: unknown". All events have the tags `area=storage`, `op=bootstrap`.

| Time (UTC, 22 Oct) | Install | Item that failed | What it shows |
| --- | --- | --- | --- |
| 16:55–16:57 | 1st | `storage.mmkvKey` (4 launches) | The app's data file was already there, so the data came from the old phone |
| 16:59 | 2nd | `vault.dek.password` | The data file was gone after the reinstall, but the Keychain items survived |
| 17:37–17:50 | 3rd | `vault.dek.password` (3 launches) | The second reinstall didn't help either |

### Root cause

- react-native-sensitive-info 6.1.5 signs every Keychain item with an HMAC check key. That key is stored `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`, so it never moves to another device.
- Our wallet items are written with `accessControl: 'none'`. That maps to `kSecAttrAccessibleAfterFirstUnlock`, so the items do move to the new device.
- On the new phone the library generates a new check key. Every moved item then fails the check, and the library throws `E_INTEGRITY_VIOLATION` without returning the value.
- `bootstrap.detectReinstall` reads the vault through `vault.hasVault()`, and `getOrCreateMmkvKey` reads the MMKV key. Both throw, and the error became code `unknown`. Bootstrap stayed rejected, so `StorageErrorScreen` showed on every launch.
- Keychain items survive an uninstall, so reinstalling could not clear it.

The user's data was intact the whole time. Only the library's device-bound check blocked it.

**Who is affected:** every iOS user on the vault-v2 builds (2.5x) who moves to a new iPhone with Quick Start or an encrypted computer backup.

### Fix

When an unprotected item fails this check on iOS:

1. The adapter reads the raw value with a native Keychain read.
2. It saves the value again with `setItem`, which re-signs the item with this phone's key.
3. The app starts normally, and the user unlocks with their password.

Items protected by Face ID / Touch ID are never recovered this way. They are `ThisDeviceOnly`, so they don't move anyway.

This is safe because the vault values are protected by our own AES-256-GCM encryption, independently of the library's check. Each recovery is logged to Sentry as `storage.integrity_restamped`. If the recovery itself fails, the error screen shows code `integrity_violation` with its own message.

| File | Change |
| --- | --- |
| `ios/CustomMethods.swift`, `ios/CustomMethods.m` | New method `readKeychainValueUnverified(service, key)`; never shows a Face ID / passcode prompt |
| `src/myWallet/wallet.service.js` | JS wrapper `readKeychainValueUnverified` |
| `src/security/secureStore.js` | Recovery in `classifyReadError` for `get` and `getFromService`; maps `E_INTEGRITY_VIOLATION` |
| `dok-wallet-blockchain-networks/security/errors.js` | New code `SECURE_STORE_ERROR_CODES.INTEGRITY_VIOLATION` (web app unaffected) |
| `src/components/StorageErrorScreen.js` | Message for `integrity_violation` |
| `jest.setup.js` | RNSI mock: `__mock.tamper(key, options)` simulates a moved item |
| `src/security/secureStore.test.js`, `src/redux/storage/bootstrap.test.js` | 8 new tests |
| `CLAUDE.md` | Note on the cause and the fix |

### Verification

- The 8 new tests pass. The two bootstrap tests replay this exact case and fail on the old code with the same errors as in Sentry.
- Full Jest run: 828 of 835 tests pass. The 7 failures also happen on unchanged HEAD: 6 known Solana/Hedera ESM suites, plus `migrateLegacyRoot2.test.js` and `store.persist.guard.test.js`. Those two load the real `react-native-fs` since 92f4b21.
- `readKeychainValueUnverified` type-checks with `swiftc`, and its Objective-C selector matches `CustomMethods.m`.
- Not done yet:
  - A full Xcode build. It stopped earlier, at the known `react-native-quick-crypto` Pods slice, which `pod install` fixes.
  - A test on a real device.

### Remaining steps

- [ ] Run `pod install`, build both iOS apps, and confirm `CustomMethods.swift` compiles.
- [ ] Reproduce on a device:
  1. Overwrite the `<SECURE_STORE_KEYCHAIN_NAME>.rnsi.hmac` / `metadata` Keychain item with an RNSI `setItem` from the Hermes inspector.
  2. Relaunch. The old build shows the error screen.
  3. Install the fixed build. It starts, and the password unlocks the wallet.
- [ ] Commit the fix and release a new iOS build of both apps. It is native code, so it can't ship over the air.
- [ ] After the release, check Sentry for `storage.integrity_restamped` logs and confirm that DOKWALLET-K stops recurring.
