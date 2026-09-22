#!/usr/bin/env bash
# Local-only Xcode 27 build fix (PR #126, iOS files only). Not merged to main:
# React Native has no official fix yet, and the patch must not ship with the
# branch. Each developer applies it locally and reverts before committing.
#
#   yarn xcode27:apply    # apply (no-op if already applied)
#   yarn xcode27:revert   # undo  (no-op if not applied)
set -euo pipefail
cd "$(dirname "$0")/.."
PATCH="xcode-27-patch/xcode-27.patch"
[ -f "$PATCH" ] || { echo "patch not found: $PATCH" >&2; exit 1; }

case "${1:-}" in
  apply)
    if git apply --reverse --check "$PATCH" >/dev/null 2>&1; then
      echo "xcode-27 patch is already applied."
    elif git apply --check "$PATCH" >/dev/null 2>&1; then
      git apply "$PATCH"
      echo "xcode-27 patch applied. Revert with 'yarn xcode27:revert' before committing iOS changes."
    else
      echo "xcode-27 patch does not apply cleanly; the iOS files have drifted. Try:" >&2
      echo "  git apply --3way $PATCH" >&2
      exit 1
    fi
    ;;
  revert)
    if git apply --reverse --check "$PATCH" >/dev/null 2>&1; then
      git apply --reverse "$PATCH"
      echo "xcode-27 patch reverted."
    elif git apply --check "$PATCH" >/dev/null 2>&1; then
      echo "xcode-27 patch is not applied; nothing to revert."
    else
      echo "cannot revert cleanly; the patched iOS files were edited after applying. Inspect with 'git diff ios/'." >&2
      exit 1
    fi
    ;;
  status)
    if git apply --reverse --check "$PATCH" >/dev/null 2>&1; then echo "applied";
    elif git apply --check "$PATCH" >/dev/null 2>&1; then echo "not applied";
    else echo "drifted"; exit 1; fi
    ;;
  *) echo "usage: $0 apply|revert|status" >&2; exit 2 ;;
esac
