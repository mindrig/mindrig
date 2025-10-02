#!/usr/bin/env bash

# This script provides workspace environment variables.
#
# Usage:
#     source "$(dirname "$0")/_env.sh"

set -eo pipefail

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "🔴 This script is meant to be sourced, not executed!"
  exit 1
fi

# Make sure mise is activated
eval "$(mise activate bash --shims)"
eval "$(mise env -s bash)"

# Provide base variables
set_vars() {
  local script_path="$0"
  root_dir="$(dirname "$0")/.."
  repo_dir="$(dirname "$script_path")/.."
  root_repo_dir="$(realpath "$(git rev-parse --git-common-dir)"/..)"
  wrkspc_name=$(realpath "$root_repo_dir" | xargs basename)
  vsc_workspace_path="$root_repo_dir/$wrkspc_name.code-workspace"
}

set_vars

add_worktree_to_workspace() {
  worktree_name="$1"
  echo "🌀 Adding worktree '$worktree_name' to VS Code workspace"

  echo -e "$(cat "$vsc_workspace_path" | jaq '
    .folders += [{
      "name": "'"$wrkspc_name"'/'"$worktree_name"'",
      "path": "trees/'"$worktree_name"'"
    }]
  ')" > "$vsc_workspace_path"
}

bootstrap_code_workspace() {
  echo "🌀 Bootstrapping VS Code workspace at '$vsc_workspace_path'"

  cat <<EOF > "$vsc_workspace_path"
{
"folders": [
  {
    "name": "$wrkspc_name",
    "path": "."
  }
]
}
EOF

  local vsc_settings_path=$(realpath "$root_repo_dir/.vscode/settings.json")
  if [ -f "$vsc_settings_path" ]; then
    echo "🌀 Applying VS Code settings from '$vsc_settings_path' to the workspace"

    local vsc_settings=$(cat "$vsc_settings_path")
    echo -e "$(cat "$vsc_workspace_path" | jaq '
      .settings = '"$vsc_settings"'
    ')" > "$vsc_workspace_path"
  fi

  mapfile -t worktrees < <(git worktree list | grep tree | grep -oP '(?<=\[worktree/)[^]]+')

  if (( ${#worktrees[@]} == 0 )); then
    echo "🟡 No worktrees found, skipping"
  else
    echo "🌀 Found ${#worktrees[@]} worktree(s), adding them to the workspace"
    for worktree_name in "${worktrees[@]}"; do
      add_worktree_to_workspace "$worktree_name"
    done
  fi

  echo -e "\n💡 Make sure to open the workspace in VS Code:\n\n    code $vsc_workspace_path\n"
}

ensure_code_workspace() {
  local mode="$1"

  if [ ! -f "$vsc_workspace_path" ]; then
    echo "🟡 VS Code workspace is not found"
    bootstrap_code_workspace
  elif [ "$mode" == "force" ]; then
    echo "🟣 Rewriting VS Code workspace"
    bootstrap_code_workspace
  fi
}