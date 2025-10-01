#!/usr/bin/env bash

# This script runs Vitest unit tests in a package. It allows to expand
# paths `<file>.ts` to `pkgs/<pkg>/<file>.ts` in the error reports, so that
# the editor picks up the correct location for navigation.

pkg_path="$(pwd)"

if [[ "$pkg_path" != *"/pkgs/"* ]]; then
  echo "🔴 This script must be run from within a package directory (e.g. pkgs/<pkg>)"
  exit 1
fi

if [[ "$1" == "watch" ]]; then
  run_mode=""
else
  run_mode="run"
fi

cd ../..

vitest --project $pkg_path $run_mode