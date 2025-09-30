#!/usr/bin/env bash

# This script checks the TypeScript types in a package. It allows to expand
# paths `<file>.ts` to `pkgs/<pkg>/<file>.ts` in the error reports, so that
# the editor picks up the correct location for navigation.

pkg_path="$(pwd)"

if [[ "$pkg_path" != *"/pkgs/"* ]]; then
  echo "🔴 This script must be run from within a package directory (e.g. pkgs/<pkg>)"
  exit 1
fi

if [[ "$1" == "watch" ]]; then
  watch_mode="--watch"
else
  watch_mode=""
fi

cd ../..

tsc --project $pkg_path $watch_mode