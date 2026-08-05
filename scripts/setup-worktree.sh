#!/usr/bin/env bash

# This script sets up a new worktree.

set -eo pipefail

echo "⚡️ Setting up worktree"
echo

echo "🌀 Pulling git submodules"

# Pull git submodules
git submodule update --recursive --init --remote

# Trust all mise configs
mise trust --yes --all
git submodule foreach --recursive "mise trust"

echo "🟢 OK"
echo

echo "🌀 Installing stack and tools"

mise install

echo "🟢 OK"
echo

echo "🌀 Installing npm packages"

# Install pnpm
pnpm install || echo -e "🟠 pnpm install failed, please make sure to check the logs, address the problem and then run:\n\n    pnpm install"

echo "🟢 OK"
echo

echo "🌀 Running setup scripts"

# Run setup scripts
turbo setup || echo -e "🟠 Setup failed, please make sure to check the logs, address the problem and then run:\n\n    turbo setup"

echo "🟢 OK"
echo

echo "🎉 Worktree is set up!"
