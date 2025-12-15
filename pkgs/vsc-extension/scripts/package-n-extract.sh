#!/usr/bin/env bash

# This script builds the VS Code extension package and extracts it to tmp
# directory. It allows to inspect the contents of the package.

source "$(dirname "$0")/_package_env.sh"

echo -e "⚡️ Packaging & extracting VS Code extension\n"

cd "$root_dir"

./scripts/package.sh

echo "🌀 Extracting package..."
tmp_path="$(pwd)/tmp/$package_name-$package_version"

rm -rf "$tmp_path"
mkdir -p "$tmp_path"

unzip -oq "$package_path" -d "$tmp_path" || {
  echo "🔴 Failed to unzip $package_path" >&2
  exit 1
}

echo -e "\n💚 Extracted package to $tmp_path"