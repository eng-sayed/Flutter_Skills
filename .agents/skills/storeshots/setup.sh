#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
python3 -m pip install -r "$ROOT/requirements.txt"
python3 -m playwright install chromium
echo "OK storeshots at $ROOT"
echo "Copy this folder to ~/.cursor/skills/storeshots if it is not already there."
