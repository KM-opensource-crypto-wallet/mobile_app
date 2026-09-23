# Xcode 27 local build patch

`xcode-27.patch` is the iOS-only part of
https://github.com/KM-opensource-crypto-wallet/mobile_app/pull/126 (the
submodule pointer bump is left out). It makes the iOS build pass on Xcode 27
while React Native has no official fix. It is a **local workaround and must not
be committed to `main`**: apply it to build, revert it before committing iOS
changes.

    yarn xcode27:apply     # apply (no-op if already applied)
    yarn xcode27:revert    # undo  (no-op if not applied)
    yarn xcode27:status    # applied | not applied | drifted

Files it touches:

- ios/AppDelegate.swift
- ios/SceneDelegate.swift
- ios/coinswallet.xcodeproj/project.pbxproj
- ios/dokwallet/Info.plist
- ios/kimlwallet/Info.plist

If `status` says `drifted`, someone changed one of those files after applying;
inspect `git diff ios/` and either revert by hand or re-create the patch with
`git diff ios/ > xcode-27-patch/xcode-27.patch` from a clean state.
