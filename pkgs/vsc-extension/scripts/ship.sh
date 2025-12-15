#!/usr/bin/env bash

# This script publishes the VS Code extension to Visual Studio Marketplace
# and Open VSX Registry.

source "$(dirname "$0")/_package_env.sh"

echo -e "⚡️ Shipping VS Code extension\n"

cd "$root_dir"

./scripts/package.sh

echo "🌀 Publishing to Visual Studio Marketplace..."

fnox exec -- pnpm vsce publish --packagePath "$package_path"

echo "🌀 Publishing to Open VSX Registry..."

fnox exec -- pnpm ovsx publish "$package_path"

echo -e "\n💚 Extension shipped!"