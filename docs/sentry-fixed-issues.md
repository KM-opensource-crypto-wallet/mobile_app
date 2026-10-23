# Fixed Sentry issues

As of 23 Oct 2026. Only issues with a fix in the code are listed here.

| Issue | Level | Events / users | Status |
| --- | --- | --- | --- |
| [DOKWALLET-K](https://kiml-view-ltd.sentry.io/issues/7807143343/) | fatal | 9 / 1 person (3 installs) | Fix on branch `divyang/iphone-backup` (PR #136, blockchains PR #107). Not yet built on a device or released. |

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

Each stored item carries a small signature tag in its metadata. On the new phone only that tag is wrong; the wallet data itself is intact. The library accepts an item **without** a tag (the old format) and adds a fresh tag the next time it saves.

So when an unprotected item fails this check on iOS:

1. A native method removes the stale tag from the item's metadata with one `SecItemUpdate`. The value, its Face ID / passcode setting and its accessibility are untouched, and the item is never deleted.
2. The adapter reads the item again and gets the value.
3. The app starts normally, and the user unlocks with their password.

The item is deliberately **not** saved again with the library's `setItem`. On iOS that is "delete, then add", and a failure between the two would lose the wallet key for good (see `docs/pr-136-review.md`).

- Items whose stored policy is Face ID / Touch ID / passcode are left alone (the native method answers `protected`). They are `ThisDeviceOnly`, so they never move anyway.
- Two reads at the same time are fine: the second finds the tag already gone (`untagged`) and simply reads again.
- This is safe because the vault values are protected by our own AES-256-GCM encryption, independently of the library's check.
- Sentry: each repair logs `storage.integrity_repaired`; a failed repair logs `storage.integrity_repair_failed` with the native error code (OSStatus). If the repair fails, the error screen shows code `integrity_violation` with its own message.

| File | Change |
| --- | --- |
| `ios/CustomMethods.swift`, `ios/CustomMethods.m` | New method `clearKeychainIntegrityTag(service, key)`: removes the stale tag in place. Answers `cleared`, `untagged`, `absent` or `protected`; never shows a prompt |
| `src/myWallet/wallet.service.js` | JS wrapper `clearKeychainIntegrityTag` |
| `src/security/secureStore.js` | Repair in `classifyReadError` for `get` and `getFromService`; logs with key names Sentry does not filter (`SENTRY_SENSITIVE_VALUE_RE`) |
| `dok-wallet-blockchain-networks/security/errors.js` | New code `SECURE_STORE_ERROR_CODES.INTEGRITY_VIOLATION` (web app unaffected) |
| `src/components/StorageErrorScreen.js` | Message for `integrity_violation` |
| `jest.setup.js` | RNSI mock: `__mock.tamper(key)` simulates a moved item; `__mock.clearIntegrityTag(key)` models the native repair |
| `src/security/secureStore.test.js`, `src/redux/storage/bootstrap.test.js` | 10 tests for this case |
| `CLAUDE.md` | Note on the cause and the fix |

### Verification

- 8 adapter tests cover:
  - the repair returns the value without any write or delete;
  - Sentry-safe log keys;
  - a failed repair (logged, value kept);
  - a Face ID item left alone;
  - a protected read;
  - Android;
  - two reads at once;
  - the legacy blob is not rewritten.
- 2 bootstrap tests replay this exact case. They fail on the original code with the same errors as in Sentry.
- Full Jest run: 843 of 850 tests pass. The 7 failures also happen without this change: 6 known Solana/Hedera ESM suites, plus `migrateLegacyRoot2.test.js` and `store.persist.guard.test.js`, which load the real `react-native-fs` since 92f4b21.
- `clearKeychainIntegrityTag` type-checks with `swiftc`, and its Objective-C selector `clearKeychainIntegrityTag:key:resolver:rejecter:` matches `CustomMethods.m`.
- Not done yet:
  - a full Xcode build (it stops earlier, at the known `react-native-quick-crypto` Pods slice; `pod install` fixes it);
  - a test on a real iPhone.

### Remaining steps

- [ ] Run `pod install`, build both iOS apps, and confirm `CustomMethods.swift` compiles.
- [ ] Reproduce on a real iPhone:
  1. On the current release, create a wallet.
  2. From the Hermes inspector, break the signature key. `accessControl: 'none'` is required: without it the library puts the key behind Face ID and the test never works.
     ```js
     setItem('metadata', '<any 32 characters>', {service: '<SECURE_STORE_KEYCHAIN_NAME>.rnsi.hmac', accessControl: 'none'})
     ```
  3. Kill and relaunch. The current release shows the "Storage problem" screen.
  4. Install the fixed build. It starts, Sentry gets `storage.integrity_repaired`, and the password unlocks the wallet.
- [ ] Merge blockchains PR #107, then this PR (#136), and release a new iOS build of both apps. It is native code, so it can't ship over the air.
- [ ] After the release, check Sentry for `storage.integrity_repaired` logs and confirm that DOKWALLET-K stops recurring.
