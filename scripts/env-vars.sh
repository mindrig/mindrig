#!/usr/bin/env bash

# This script exports env variables for mise.

set -eo pipefail

if [ -f ~/.config/fnox/age.txt ]; then
  export FNOX_AGE_KEY="$(cat ~/.config/fnox/age.txt | grep "AGE-SECRET-KEY")"
fi

# GDK scaling for high-DPI displays (for Tauri apps running in WSL2)
export GDK_DPI_SCALE=1.25