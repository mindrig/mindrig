#!/usr/bin/env bash

# This script is when the container is updated.

set -e

source ~/.config/mothership/.env || true

# Make sure mise is activated
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  export PATH="$HOME/.local/bin:$PATH"
fi
eval "$(mise activate bash --shims)"
eval "$(mise env -s bash)"

# Pull git submodules
if [ -e .git ]; then
  git submodule update --recursive --init --remote
fi

# Trust all mise configs
mise trust --yes --all
if [ -d .git ]; then
  git submodule foreach --recursive "mise trust"
fi

# Update mise
mise self-update -y

# Install stack
mise install

# Install dependencies
if [ -f ./pnpm-lock.yaml ]; then
  yes | pnpm install
elif [ -f ./yarn.lock ]; then
  yes | yarn install
elif [ -f ./package-lock.json ]; then
  yes | npm install
fi

# Install dependencies
if [ -f ./Cargo.lock ]; then
  cargo build || echo "🟡 Cargo build failed, but that's ok"
fi

# Setup
turbo setup || echo -e "🟠 Setup failed, please make sure to check the logs, address the problem and then run:\n\n    turbo setup"