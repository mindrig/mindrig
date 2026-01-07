#!/usr/bin/env bash

# This script sets up macOS for development. Currently, it only ensures that
# the landing page is set up.

set -eo pipefail

echo -e "⚡️ Setting up macOS for development\n"

# Ensure Homebrew is installed
if ! command -v brew >/dev/null 2>&1; then
  echo "🔴 Homebrew is required but not installed. See: https://brew.sh/"
  exit 1
fi

# Update Homebrew before installing anything
brew update

# Ensure Bash is at latest version
if [[ "$(type -t mapfile || true)" != "builtin" ]]; then
  if [ "$1" == "restart" ]; then
    echo "🔴 Failed to restart with the new Bash. Exiting."
    exit 1
  fi

  echo "🟡 Bash is too old. Installing latest version..."

  brew install bash

  echo -e "🟡 Restarting the script with the new Bash\n"

  ./scripts/setup-macos.sh restart

  # We delegated to the new Bash, so we don't need to continue
  exit 0
fi

echo "🌀 Installing mise"

# Install mise
brew install mise

# Configure shell to activate mise
append_if_missing() {
  local line="$1"
  local file="$2"
  touch "$file"
  if ! grep -Fqx "$line" "$file"; then
    echo "$line" >> "$file"
  fi
}
case "$SHELL" in
  */fish)
    append_if_missing \
      'mise activate fish | source' \
      "$HOME/.config/fish/config.fish"
    ;;
  */zsh)
    append_if_missing \
      'eval "$(mise activate zsh)"' \
      "${ZDOTDIR:-$HOME}/.zshrc"
    ;;
  *)
    append_if_missing \
      'eval "$(mise activate bash)"' \
      "$HOME/.bashrc"
    ;;
esac

# Make sure mise is activated for this script
# Add to PATH if needed
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  export PATH="$HOME/.local/bin:$PATH"
fi
eval "$(mise activate bash --shims)"
eval "$(mise env -s bash)"

echo "🌀 Pulling git submodules"

echo "🌀 Installing misc tools"

brew install ansible

# Pull git submodules
git submodule update --recursive --init --remote

# Trust all mise configs
mise trust --yes --all
git submodule foreach --recursive "mise trust"

echo "🌀 Installing stack and tools"

# Install stack
mise install

echo "🌀 Installing npm packages"

# Install pnpm
pnpm install || echo -e "🟠 pnpm install failed, please make sure to check the logs, address the problem and then run:\n\n    pnpm install"

echo "🌀 Running setup scripts"

# Run setup scripts
turbo setup || echo -e "🟠 Setup failed, please make sure to check the logs, address the problem and then run:\n\n    turbo setup"

echo -e "💚 macOS is set up!"