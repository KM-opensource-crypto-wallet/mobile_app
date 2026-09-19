# Amendments — Secure Storage & Key-Management Redesign

Date: 2026-09-19
Status: SUPERSEDED 2026-09-19 — folded into `2026-09-19-secure-storage-final-plan.md` (kept as history). Originally: PROPOSED — append to the plan as §12 and resolve §12.2 before Phase 1 starts.
Basis: external review (Kimi, 2026-09-19) plus verification against `mobile_app` @ `ae97159`, `web_wallet` @ `b380d16`, shared submodule `dok-wallet-blockchain-networks` (`KM-opensource-crypto-wallet/blockchains`) @ `da92f47` — the same commit in both repos.

None of the following changes the architecture of §3. Two items (§12.2.1, §12.2.2) should gate the start of Phase 1; the rest are edits to existing sections.

---

## 12.1 Disposition of the external review

| # | Review item | Verdict | Action |
|---|---|---|---|
| 1 | R9 not met in Phase 2 | Accept, modified | Restate R9's scope (§12.2.3). Do **not** pull slimming forward. |
| 2 | Pre-unlock behaviour change not enumerated | **Accept — gating** | §12.2.2. Cited mechanism corrected. |
| 3 | iOS Keychain survives uninstall, MMKV does not | Accept | §12.3.2 |
| 4 | Use `deleteMMKV()` in the wipe | Accept, verify API | §12.3.1 |
| 5 | Phase 4 plaintext XMTP bodies contradict §0.1 | Accept | §12.3.6 |
| 6a | `verifyPassword` costs a full 600k PBKDF2 per confirm | Accept | §12.3.7 |
| 6b | Lockout counter in MMKV is not a security boundary | Accept | §12.3.7 |
| 6c | `hideSettings` PBKDF2 hash stays in Tier 1 | Accept | §12.3.3 |
| 6d | Forgot-password provably means vault unrecoverable | Accept | §12.3.7 |
| 7 | Split Phase 2; land engine dark behind a flag | **Reject** | §12.4 |

The review's verified-claims section was not independently re-verified line by line here, but every claim in it is consistent with the plan's own §1.1 citations, and the three load-bearing library claims (redux-persist `timeout: 0` disabling the seal timer; Android `BiometricPrompt` firing on `setItem`; iOS Keychain items outliving uninstall) are correct. The one claim that is materially wrong is in item 2 and is corrected below.

---

## 12.2 Gating items — resolve before Phase 1

### 12.2.1 The plan edits a submodule the web wallet also consumes (NEW — blocking)

`dok-wallet-blockchain-networks` is a git submodule shared by `mobile_app` and `web_wallet`, currently pinned to the same commit `da92f47` in both. Three of §11's changes land inside it:

- `redux/wallets/walletSecrets.js` (new)
- `redux/wallets/walletsSlice.js` — `hydrateWalletSecrets`
- `redux/auth/authSlice.js`, `authSelectors.js` — add `hasAccount`, **delete `getUserPassword`**, stop writing `state.password` (§6.2)

The web wallet has seven live consumers of `getUserPassword`:

| File | Line | Use |
|---|---|---|
| `src/app/auth/login/page.jsx` | 54 | password comparison |
| `src/app/verify/verify-login/page.jsx` | 58 | password comparison |
| `src/app/settings/change-password/page.jsx` | 28 | password comparison |
| `src/app/wallet/[clientId]/layout.jsx` | 32 | `Boolean(...)` has-account routing |
| `src/components/LegacyRouteRedirect/index.jsx` | 37 | `Boolean(...)` has-account routing |
| `src/components/AppRouting/index.jsx` | 85 | routing |
| `src/components/CarouselCards/index.jsx` | 16 | routing |

`authSlice.js:83,88,92` (`state.password = action.payload`) is what feeds all of them.

Failure mode if the submodule change is not additive: the web wallet **still builds**. `getUserPassword` returns `undefined`, the two `Boolean(...)` routing guards go false, and every existing web user is silently routed to onboarding as though they had no wallet; login, verify-login and change-password stop authenticating. A silent routing regression on a funded wallet is materially worse than a compile error.

**Amendment.** In Phase 2 the submodule change is **additive only**:

- add `hasAccount` to `authSlice` initial state and set it in `signUpSuccess` / `logOutSuccess`;
- add `getHasAccount` to `authSelectors.js`;
- **keep** `getUserPassword` and the `state.password` writes for now;
- have the mobile `auth` persist blacklist drop `password` (§5.2), so the field exists in memory but never reaches MMKV on mobile.

Move the deletion of `getUserPassword` and the `state.password` writes to **Phase 3**, gated on the web wallet having its own replacement. Add to Phase 2's definition of done: the submodule bump is reviewed against both consumers, and `web_wallet` builds and boots an existing localStorage profile on the new submodule commit.

Note also that `mobile_app`'s submodule pointer is currently dirty (`M dok-wallet-blockchain-networks`); the two repos' pointers need coordinating as part of the Phase 2 release, not after it.

### 12.2.2 Pre-unlock behaviour audit (review #2, mechanism corrected)

The plan handles the hydration-merge direction — `resetCoinsToDefaultAddressForPrivacyMode` writing `undefined` keys pre-unlock (`main.js:302`) — but not the converse. Today every code path works before login because the store is always decrypted; that is precisely the hole being closed, so closing it is a behaviour change with its own surface.

The review's example is directionally right but wrong on mechanism, and the correction matters for scoping:

- `AUTO_ANSWERED_METHODS` in `dok-wallet-blockchain-networks/service/walletconnect.js:119` is `wallet_getCapabilities` and `hedera_getNodeAddresses` only. Both are read-only; **neither signs**. The auto-answer path is not at risk.
- The actual exposure is that WalletConnect is live before login: `main.js:183` calls `initWalletConnect` inside the `isReduxStoreLoad` block (`main.js:292`), with no `isLogin` gate, in the same effect that dispatches `resetCoinsToDefaultAddressForPrivacyMode` (`main.js:302`). A `session_request` arriving while the user sits on Login raises the request modal over the Login screen, and approval reads a key that is now absent.
- Any thunk reaching `resolveWallet` pre-unlock now throws `'getCoin condition not found'` where it previously succeeded.

**Amendment.** Add to Phase 2 as an explicit line item: enumerate every secret-dependent entry point that can fire between rehydration and unlock — WalletConnect `session_request` and `session_proposal`, pending-transaction send/poll, refresh intervals, staking / exchange / coinSync / message thunks, deep links (`getInitialUrlLink`, `setWcUri`) — and make each either fail gracefully with a "unlock to continue" path or queue until `vault.isUnlocked()`. Document the enumeration in §6.3 and cover it with one test that dispatches a representative secret-dependent action against a rehydrated-but-locked store.

The headless notifee handler is unaffected: `index.js:41-70` waits for `persistor.bootstrapped`, reads `schedulePayment`, and does not sign.

### 12.2.3 Restate R9 (review #1, modified)

R9 as written ("p95 serialise+write < 16 ms for the largest slice") will not be met by Phase 2 for heavy wallets: the `wallets` slice is still one `JSON.stringify` over full transaction histories, UTXO sets and the NFT cache, merely throttled and written to cheap storage.

**Amendment.** Rewrite R9 as two requirements:

- **R9a (Phase 2)** — persist writes no longer re-encrypt a multi-megabyte blob in the platform secure store, no longer fire per action, and no longer serialise unchanged slices. Evidence: the §9.4 breadcrumb, before vs after, on the same device and wallet set.
- **R9b (Phase 4)** — p95 serialise+write < 16 ms for the largest slice on a mid-range Android.

Do **not** pull the 200-transaction cap into Phase 2. The review calls `JSON.stringify` "the freeze's biggest contributor"; the plan's own §0 diagnosis says otherwise — the dominant cost is a store designed for small secrets re-encrypting megabytes on effectively every action. Phase 2 removes that, the write-per-action, and the whole-store double serialise. Splitting R9 records honestly what each release buys without widening an already large one. If the Phase 2 measurement shows the remaining stringify is still user-visible, the cap is a small transform change that can follow as a point release.

---

## 12.3 Amendments to existing sections

### 12.3.1 §5.2 purge — use `deleteMMKV()`
`react-native-mmkv` is not yet in `node_modules`, so the v4 API could not be confirmed locally. Subject to that check, replace the `clearAll()` + delete-the-key sequence with `deleteMMKV('dok.state')` before `RNRestart`. The current sequence leaves an empty file encrypted under a key that has just been deleted, then reopens it after restart with a fresh key and relies on MMKV's corrupt-file fallback treating it as empty. Add `deleteMMKV`/`existsMMKV` availability in 4.3.x to §10.

### 12.3.2 §5.1 bootstrap — reinstall detection
iOS Keychain items survive app uninstall; the MMKV file does not. After reinstall, `storage.mmkvKey` and the vault items remain while `dok.state` and `hasAccount` are gone. Mostly benign — onboarding runs and the next `createVault` overwrites — but it leaves an orphaned `vault.dek.biometric` bound to a dead DEK. Add to `bootstrapStorage()`: MMKV sentinel absent **and** secure-store vault items present → wipe the secure store before proceeding.

### 12.3.3 §5.3 — `hideSettings` (review 6c)
`hideSettings` (PBKDF2 hash + salt) is currently kept in Tier 1. It is an offline brute-force target for the hidden-wallet password, and nothing pre-unlock reads it — the inbound `wallets` transform forces `isHidden` without touching the hash, and verification happens post-unlock. Either move it into the vault payload or record in §5.3 why it is deliberately left out. Moving it is the default.

### 12.3.4 §3.4 — order the vault write against the slice write (NEW)
The listener debounces 500 ms; the persist throttle is 1000 ms. Nothing orders the two. If the process dies between a stripped `persist:wallets` write and the vault write, a newly created or imported wallet persists **without its key** — the user sees a wallet they cannot spend from, and no error is raised.

**Amendment.** For the wallet-creating paths (`createWallet`, `createWalletsBatch`, import, `addToken` where a new key is generated) call `await vault.saveSecrets(...)` on the critical path rather than relying on the debounced listener; keep the listener for incremental changes. Add a hydrate-time consistency check: any `clientId` present in `persist:wallets` but absent from the vault payload raises a blocking error with a Sentry tag `vault.missing_secrets`, rather than rendering an unusable wallet. Cover with a kill-simulation test alongside the §9.2/3 migration one.

### 12.3.5 §7 — migration KDF can run in the headless task (NEW)
`bootstrapStorage()` runs the migrator to completion (§5.1 step 4), and the headless notifee handler triggers the same memoised bootstrap via `require('./src/redux/store')` and then awaits `persistor.bootstrapped` (`index.js:41-70`). After the first device unlock since boot, a delivered scheduled-payment reminder can therefore run the full migration — including one 600k PBKDF2 at 0.5–2 s — inside a background task with its own time budget.

**Amendment.** When `context === 'headless'`, run the non-secret slice migration only and defer step 3 (vault creation) and step 6 (`schemaVersion = 2`) to the foreground, so the state machine stays at 0 and redoes cleanly. Add this case to QA item (i).

### 12.3.6 Phase 4 — strike the unencrypted message cache (review #5)
§0.1 argues that non-sensitive state is still privacy-relevant and therefore encrypts Tier 1; Phase 4 then proposes moving XMTP message bodies to the unencrypted `dok.cache`. That is the most privacy-sensitive free text in the app. Remove the option: keep bodies in `dok.state` with a size cap, or drop persistence.

### 12.3.7 Notes to add (review 6a, 6b, 6d)
- **§6.2 / product** — `verifyPassword` costs a full 600k PBKDF2 on every `ModalConfirmTransaction` entry: ~0.5–2 s on low-end Android. Unavoidable (the KDF is the verifier), but the spinner needs product sign-off, and QA item (o) should cover the confirm-transaction path, not only unlock.
- **§2** — state explicitly that the `attempts` lockout counter moves from the secure store into MMKV under a Keystore-wrapped key, so on a rooted device (T3) it is resettable. Wipe-after-N-attempts is UX defence-in-depth; the 600k KDF is the brute-force boundary. This is consistent with the threat model, but should be written down rather than implied.
- **UX copy** — forgot-password now provably means the vault is unrecoverable (seed phrase or nothing, as MetaMask). Behaviour is unchanged since that flow already wipes, but the copy should say it plainly.

---

## 12.4 Rejected — landing Phase 2 dark behind a flag (review #7)

The concern (a large PR: store rewrite + vault + migrator + ~15 UI touchpoints) is real; the proposed mitigation is not. A flag around a storage rewrite means two live persistence engines writing storage, plus flag state that itself has to persist somewhere and be readable before the storage layer is chosen — more risk, not less, and the dual path is exactly where a migration loses data.

Keep one release. Address reviewability with stacked PRs into a release branch, ordered: secure store + crypto + vault → `walletSecrets` + strip/hydrate → per-slice persist engine → migrator → UI touchpoints. The staged rollout and legacy retention until finalise (already in the plan) remain the release-level mitigation.

---

## 12.5 Out of scope, but tracked — the web wallet stores the same secrets far more weakly (NEW)

This does not belong in this plan's phases, but R2 ("A4 is never stored in any form") becomes false at the product level the moment a user with the same password also uses the web wallet, so it should not be discovered later.

`web_wallet/src/redux/store.js:78-90` persists the whole store — including `auth.password` and every mnemonic, private key and extended private key — to browser `localStorage` via `redux-persist`, with `encryptTransform({secretKey: process.env.REDUX_WEB_KEY})` (`store.js:33-34`) as the only protection. `next.config.js:29` inlines `REDUX_WEB_KEY` through Next's `env` block, which is a build-time literal substitution shipped in the client bundle; the checked-in `.env:18` is `REDUX_WEB_KEY=test`.

So the web blob is encrypted with a constant that any visitor can read out of the JavaScript, with no hardware-backed layer, no KDF and no per-user salt. Threats T1, T2, T3 and T5 all apply, more directly than on mobile.

**Action:** confirm what value the production build actually injects (a real value is still a shipped constant, so this is a question of degree), and open a separate tracked item for the web wallet. When it is planned, the two-layer model transfers — WebCrypto PBKDF2/Argon2 over the typed password, a DEK wrapping a vault in IndexedDB, secrets stripped from the persisted state — reusing `walletSecrets.js` from the submodule, which is one more reason to land that file additively (§12.2.1).

Cross-platform Drive backup is unaffected: both `googleDriveBackup.js` implementations take the typed password as a parameter (`BackupWallets.js:228`, `RestoreWallets.js:228`), not the stored one, so the v2 key material `${password}\x00${secret}` and the backup format stay compatible across mobile and web.

---

## 12.6 Additions to §10 open items

- `deleteMMKV(id)` / `existsMMKV(id)` presence and semantics in the installed `react-native-mmkv` 4.3.x (§12.3.1).
- Whether the production `web_wallet` build injects a non-placeholder `REDUX_WEB_KEY` (§12.5).
- Whether `walletSecrets.js` should live in the submodule (shared with the web wallet, as recommended) or in `mobile_app/src` — the plan currently places it in the submodule, which is right only if the web wallet is expected to reuse it.
