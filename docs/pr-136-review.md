# Review: PR #136 (mobile_app) and PR #107 (blockchains)

**Status (23 Oct 2026):** changes 1–5 below are applied on `divyang/iphone-backup` and not committed yet. Change 6 (the submodule pointer) is handled at merge time: blockchains #107 merges first, and production builds take the submodule's `main`.

---

## The short version

1. **The fix works, but the way it saves data back is risky.** In rare cases it can delete the wallet key for good. We should change the method before merging.
2. **The submodule points to a commit that will disappear.** After the blockchains PR is merged, the app will not be able to download it.

Everything else is small.

---

## Problem 1: the fix can lose the wallet key (rare, but permanent)

### What the fix does now

When the app can't read an item on a new iPhone, it does this:

1. Read the raw value from the iPhone Keychain (the phone's secure storage).
2. Save it again, so the library signs it with the new phone's key.

Step 2 is the problem. When the library "saves", it actually does two things:

```
delete the old item   →   add the new item
                     ↑
             danger gap: if anything
             goes wrong here, the item is gone
```

If the app is killed in that gap, or the "add" fails, the item no longer exists. The item we save is `vault.dek.password`, the key that unlocks every wallet. Without it, the wallets can never be decrypted.

The vault already protects itself against this gap. Every normal vault save first writes a backup copy (`vault.js`, the "staged" keys). Our fix skips that protection.

How likely is it? Very unlikely, because the gap is tiny. But the result is permanent loss of the wallet, so we should not take the risk.

### The better fix

Each stored item has a small "signature tag" inside it. The tag is the only thing that's wrong on the new phone; the wallet data itself is fine.

The library already accepts items with **no tag** (the old format), and it adds a fresh tag the next time it saves. So instead of rewriting the whole item, we just **remove the stale tag**, in one single Keychain update:

```
Now:     read value  →  DELETE item  →  (gap)  →  ADD item
Better:  remove the old tag inside the item         (one step, never deleted)
```

| | Now | Better |
| --- | --- | --- |
| Item is deleted at any point | Yes | No |
| Wallet value passes through JavaScript | Yes | No |
| Face ID / Touch ID setting kept | No (forced to "none") | Yes |
| Safe if two reads happen at the same time | No | Yes |

### Other problems the better fix also solves

- If saving failed, we threw away the value we had just read, and the user still saw the error screen.
- Two reads of the same item at the same time could clash, and one of them would fail.
- The old `persist:root2` data was rewritten for no reason.

---

## Problem 2: the submodule points to a commit that will disappear

- The app's submodule `dok-wallet-blockchain-networks` points to commit `69304b2`.
- That commit exists only on the feature branch `divyang/iphone-backup-issues`.
- The blockchains repo uses **squash merge**. After PR #107 is merged, `main` gets a new commit, and `69304b2` is never on `main`.
- When the feature branch is deleted, the app can't download `69304b2`. `yarn git:update` and Codemagic builds then fail.

**Fix:** after blockchains #107 is merged, update the app's submodule to the new commit on blockchains `main`.

### Also found: `main` is missing an earlier safety fix

- PR #135 (shell vulnerabilities) moved the submodule back to an older commit (`4564870`).
- So the app's `main` currently builds **without** the vault "backup copy" safety fix from #134/#106.
- This PR brings that fix back. Mention it in the PR description so nobody is surprised.

---

## Small things

- **Logging:** when the native read fails, its error code is hidden. Add a `storage.integrity_repair_failed` log with the reason.
- **Reuse:** `logSafeKey` hides only the word "password". Use the existing `SENTRY_SENSITIVE_VALUE_RE` (`legacyRootMigration.js`), which covers every word Sentry filters.
- **Tests:** add a test for "the repair fails".
- **`docs/sentry-fixed-issues.md`:**
  - The test step must say `accessControl: 'none'`. Without it, the library puts the key behind Face ID and the test never works.
  - It names the wrong branch: it should be `divyang/iphone-backup`.

---

## What I will change (after you agree)

| # | File | Change |
| --- | --- | --- |
| 1 | `ios/CustomMethods.swift`, `ios/CustomMethods.m` | Replace `readKeychainValueUnverified` with `clearKeychainIntegrityTag`. It removes the stale tag with one Keychain update and skips items protected by Face ID. |
| 2 | `src/myWallet/wallet.service.js` | Rename the JS wrapper to match. |
| 3 | `src/security/secureStore.js` | On this error: remove the tag, read again, and return the value. No more delete + add. Log success and failure. Use `SENTRY_SENSITIVE_VALUE_RE`. |
| 4 | `jest.setup.js`, `secureStore.test.js`, `bootstrap.test.js` | Update the mocks. Add tests for a failed repair, a protected item, two reads at once, Android, and the legacy blob (no write). |
| 5 | `docs/sentry-fixed-issues.md`, `CLAUDE.md` | Fix the test step and the branch name, and describe the new method. |
| 6 | Submodule pointer | After blockchains #107 is merged, point to its commit on `main`. |

## How we will test it

1. Run `npx jest`. Expect 828/835 as before; the 7 failures are old and unrelated.
2. Build both iOS apps (`pod install` first).
3. On a real iPhone:
   1. Break the signature key with `setItem('metadata', '<32 chars>', {service: '<name>.rnsi.hmac', accessControl: 'none'})`.
   2. Relaunch: the old build shows the error screen.
   3. Install the fixed build: it starts, and the password unlocks the wallet.
4. Before merging, check that the submodule commit is on blockchains `main`.
