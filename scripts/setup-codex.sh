#!/usr/bin/env bash

set -eo pipefail

echo -e "⚡️ Setting up Codex\n"

root_dir="$(dirname "$0")/.."

# Link local Codex config to home directory, as it doesn't support relative
# paths yet: https://github.com/openai/codex/issues/3706

echo -e "🌀 Link local Codex config to ~/.codex/config.toml"

codex_config_path_chunk=".codex/config.toml"
local_codex_config_tmpl_path=$(realpath "$root_dir/$codex_config_path_chunk")
global_codex_config_path="$HOME/$codex_config_path_chunk"

mkdir -p "$(dirname "$global_codex_config_path")"
ln -sf "$local_codex_config_tmpl_path" "$global_codex_config_path"

echo -e "\n💚 Codex setup complete!"