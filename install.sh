#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/.agents/skills"
if [[ ! -d "$SRC" ]]; then
  echo "missing $SRC" >&2
  exit 1
fi

DESTS=(
  "$HOME/.agents/skills"
  "$HOME/.cursor/skills"
  "$HOME/.claude/skills"
  "$HOME/.codex/skills"
)

for dest in "${DESTS[@]}"; do
  mkdir -p "$dest"
  for skill in "$SRC"/*; do
    [[ -d "$skill" ]] || continue
    name="$(basename "$skill")"
    target="$dest/$name"
    if [[ -L "$target" || -e "$target" ]]; then
      rm -rf "$target"
    fi
    ln -sfn "$skill" "$target"
    echo "linked $name → $target"
  done
done

if [[ -f "$SRC/storeshots/setup.sh" ]]; then
  bash "$SRC/storeshots/setup.sh"
fi

echo
echo "OK. Restart Cursor / Claude Code / Codex."
echo "Skills: storeshots, prod, build_test"
