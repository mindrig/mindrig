#!/usr/bin/env bash

# This script exports env variables for mise.

set -eo pipefail

if [ -f ~/.config/fnox/age.txt ]; then
  export FNOX_AGE_KEY="$(cat ~/.config/fnox/age.txt | grep "AGE-SECRET-KEY")"
fi