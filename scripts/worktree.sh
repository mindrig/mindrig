#!/usr/bin/env bash

# This script provides git worktree management flow.

set -eo pipefail

# Make sure mise is activated
eval "$(mise activate bash --shims)"
eval "$(mise env -s bash)"

script_path="$0"
root_dir="$(dirname "$script_path")/.."
root_repo_dir="$(git rev-parse --show-toplevel)"
wrkspc_name=$(realpath "$root_repo_dir" | xargs basename)
code_workspace_path="$root_repo_dir/wrkspc.code-workspace"

add_worktree_to_workspace() {
  worktree_name="$1"
  echo "🌀 Adding worktree '$worktree_name' to VSCode workspace"

  echo -e "$(cat "$code_workspace_path" | jaq '
    .folders += [{
      "name": "'"$wrkspc_name"'/'"$worktree_name"'",
      "path": "trees/'"$worktree_name"'"
    }]
  ')" > "$code_workspace_path"
}

bootstrap_code_workspace() {
  if [ ! -f "$code_workspace_path" ]; then
    echo "🟡 VS Code workspace is not found"
    echo "🌀 Bootstrapping VSCode workspace at '$code_workspace_path'"

    cat <<EOF > "$code_workspace_path"
{
  "folders": [
    {
      "name": "$wrkspc_name",
      "path": "."
    }
  ]
}
EOF

    for worktree_name in $(git worktree list | grep tree | grep -oP '(?<=\[tree/)[^]]+'); do
      add_worktree_to_workspace "$worktree_name"
    done

    echo -e "\n💡 Make sure to open the workspace in VS Code:\n\n    code $code_workspace_path\n"
  fi
}

set_worktree_vars() {
  cmd="$1"
  worktree_name="$2"
  if [ -z "$worktree_name" ]; then
    echo -e "🔴 No feature name provided. Please pass it as an argument:\n\n    $script_path $cmd <NAME>\n"
    exit 1
  fi
  worktree_dir="$root_repo_dir/trees/$worktree_name"
  worktree_branch="worktree/$worktree_name"
  worktree_git_dir="$root_repo_dir/.git/worktrees/$worktree_name"

  echo "🔵 Worktree '$worktree_name' at '$worktree_dir' on branch '$worktree_branch'"
}

cd_worktree() {
  cd "$worktree_dir" || (echo "\n🔴 Can't cd to $worktree_dir. Does this directory exist?" && exit 1)
}

cd_root() {
  cd "$root_repo_dir" || (echo "\n🔴 Can't cd to $root_repo_dir. Does this directory exist?" && exit 1)
}

get_worktree_dir() {
  cmd="$1"
  local worktree_name="$2"
  if [ -z "$worktree_name" ]; then
    echo -e "🔴 No feature name provided. Please pass it as an argument:\n\n    $script_path $cmd <NAME>\n"
    exit 1
  fi
}

new() {
  echo -e "⚡️ Creating worktree\n"

  bootstrap_code_workspace

  set_worktree_vars new "$1"

  echo -e "🌀 Creating the worktree"

  cd "$root_repo_dir"

  if [ -d "$worktree_git_dir" ]; then
    echo -e "\n🔴 Worktree for feature '$worktree_name' already exists."
    exit 1
  fi

  if ! err=$(git worktree add -b "$worktree_branch" "$worktree_dir" origin/main 2>&1); then
    echo -e "\n🔴 Failed to create worktree at '$worktree_dir':\n\n$err"
    exit 1
  fi

  cd_worktree

  echo -e "🌀 Setting up environment "
  ./.devcontainer/scripts/on-update.sh

  add_worktree_to_workspace "$worktree_name"

  echo -e "\n💚 Worktree created!"

  echo -e "\n💡 Start working on the worktree:\n\n    cd $worktree_dir\n"
}

drop() {
  echo -e "⚡️ Removing worktree\n"

  bootstrap_code_workspace

  set_worktree_vars rm "$1"

  echo -e "🌀 Removing the worktree from VS Code workspace $code_workspace_path"
  echo -e "$(cat "$code_workspace_path" | jaq '
    .folders |= map(select(.name != "'"$wrkspc_name"'/'"$worktree_name"'"))
  ')" > "$code_workspace_path"

  echo -e "🌀 Removing the worktree"

  if [ ! -d "$worktree_git_dir" ]; then
    echo -e "\n🔴 Worktree for feature '$worktree_name' does not exist."
    exit 1
  fi

  cd_worktree

  if [ -n "$(git status --porcelain)" ]; then
    echo -e "🟠 Worktree '$worktree_name' has uncommitted changes."
    read -r -p "❔️️ Are you sure you want to continue? This will discard all uncommitted changes. [Y/n] " yn
    case "$yn" in
      [Yy]*) ;;
      *)
        echo "🟡 Aborting worktree removal."
        exit 0
        ;;
    esac
  fi

  if ! git merge-base --is-ancestor "$worktree_branch" origin/main; then
    echo -e "🟠 Worktree branch '$worktree_branch' has not been merged or rebased into 'main'."
    read -r -p "❔️ Are you sure you want to continue? This may discard unmerged commits. [Y/n] " yn
    case "$yn" in
      [Yy]*) ;;
      *)
        echo "🟡 Aborting worktree removal."
        exit 0
        ;;
    esac
  fi

  cd_root

  if ! err=$(git worktree remove "$worktree_dir" --force 2>&1 > /dev/null); then
    echo -e "\n🔴 Failed to remove worktree at '$worktree_dir':\n\n$err"
    exit 1
  fi

  if ! err=$(git worktree prune 2>&1 > /dev/null); then
    echo -e "\n🔴 Failed to prune worktrees:\n\n$err"
    exit 1
  fi

  echo -e "🌀 Removing the worktree branch"
  if ! err=$(git branch -D "$worktree_branch" 2>&1 > /dev/null); then
    echo -e "\n🔴 Failed to delete branch '$worktree_branch':\n\n$err"
    exit 1
  fi

  echo -e "\n💚 Worktree removed!"
}

cmd="$1"
case "$cmd" in
  new) new $2 ;;
  rm)  drop $2 ;;
  *)   echo -e "🔴 Unknown command: $cmd\n\nTo create a new worktree:\n\n    $script_path new <NAME>\n\nTo remove a worktree:\n\n    $script_path rm <NAME>\n" && exit 1 ;;
esac

