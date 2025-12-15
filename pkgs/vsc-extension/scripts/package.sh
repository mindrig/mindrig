#!/usr/bin/env bash

# This script builds and packages the VS Code extension.

source "$(dirname "$0")/_package_env.sh"

echo -e "⚡️ Packaging VS Code extension\n"

cd "$root_dir"

echo "🌀 Building VS Code extension..."
turbo build --ui stream

echo "🌀 Packaging vsix..."
pnpm vsce pack \
  --no-dependencies \
  --baseContentUrl https://github.com/mindrig/mindrig/tree/HEAD/pkgs/vsc-extension \
  --baseImagesUrl https://github.com/mindrig/mindrig/raw/HEAD/pkgs/vsc-extension

echo -e "\n💚 Extension package is ready!"