#!/usr/bin/env bash

# This script updates dotfiles using chezmoi and then applies any necessary
# modifications, like merging Codex config.

source "$(dirname "$0")/_env.sh"

echo -e "⚡️ Updating dotfiles\n"

echo -e "🌀 Applying latest chezmoi config\n"

if chezmoi update --force; then
  echo
  "$root_dir/scripts/setup-codex.sh"
else
  echo
  echo "🟠 No chezmoi or dotfiles setup found, ignoring"
fi