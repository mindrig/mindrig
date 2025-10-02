#!/usr/bin/env bash

# This script merges global and local Codex config and expands necessary
# environment variables (as they aren't supported yet: https://github.com/openai/codex/issues/2680).

source "$(dirname "$0")/_env.sh"

echo -e "⚡️ Setting up Codex\n"

# Merge local Codex config to global config, as it doesn't support relative
# paths yet: https://github.com/openai/codex/issues/3706

echo -e "🌀 Merging project Codex config to ~/.codex/config.toml"

codex_config_path_chunk=".codex/config.toml"
local_codex_config_tmpl_path=$(realpath "$root_dir/$codex_config_path_chunk")
global_codex_config_path="$HOME/$codex_config_path_chunk"

ansible-playbook "$root_dir/scripts/setup-codex/playbook.yaml" \
  -i localhost, --connection=local \
  --extra-vars "global_config=$global_codex_config_path project_config=$local_codex_config_tmpl_path"

echo -e "\n💚 Codex setup complete!"