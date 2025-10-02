#!/usr/bin/env bash

# This script starts a new shell using the agent environment.

source "$(dirname "$0")/_env.sh"

echo -e "⚡️ Starting agent shell environment\n"

if set_vars_code=$(cat ~/.codex/config.toml | dasel -o json -i toml '$root.shell_environment_policy.set' | jq -r 'to_entries[] | "export \(.key)=\"\(.value)\""'); then

  echo -e "🌀 Applying following variables\n"
  echo "$set_vars_code"
  echo
  eval "$set_vars_code"
else
  echo -e "\n🟠 No global Codex or shell environment variables found, ignoring"
fi

"$SHELL"