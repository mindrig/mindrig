#!/usr/bin/env bash

# This script is run after the container is created.

set -e

source ~/.config/mothership/.env || true

# Make sure mise is activated
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  export PATH="$HOME/.local/bin:$PATH"
fi
# Update it
mise self-update -y
# Activate it
eval "$(mise activate bash --shims)"
eval "$(mise env -s bash)"

# Make sure pnpm is installed
yes | pnpm install

# Update apt packages
sudo apt update

# Install xvfb and dbus to run VS Code
sudo apt install -y xvfb dbus-x11

# Install VS Code for extension testing
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/packages.microsoft.gpg
sudo install -o root -g root -m 644 /tmp/packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install -y code

# Install Playwright dependencies
pnpm -F vscode exec playwright-core install-deps chromium

# Install Tauri dependencies
sudo apt install -y \
  pkg-config \
  libwebkit2gtk-4.1-dev \
  libxdo-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev