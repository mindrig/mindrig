#!/usr/bin/env bash

set -e

# This script is run on THE HOST when the source code is located.
echo -e "⚡️ Bootstrapping host directories and files...\n"

devcontainer_id=$1
if [ -z "$devcontainer_id" ]; then
	echo "🔴 No devcontainer ID provided. Usage: ./initialize.sh <devcontainer-id>" >&2
	exit 1
fi

echo "🌀 Ensuring state directories"

state_dir="$HOME/.local/state/mothership/containers/$devcontainer_id"
mkdir -p "$state_dir"

dirs=(
	".cache"
	".local/share"
	".local/state"
	".rustup"
	".codex/sessions"
)

for rel_dir in "${dirs[@]}"; do
	dir="$state_dir/$rel_dir"
	mkdir -p "$dir"
	echo "🔹 $rel_dir"
done

echo

echo -e "🌀 Ensuring host directories\n"

dirs=(
	".cargo"
	".codex"
)

for rel_dir in "${dirs[@]}"; do
	dir="$HOME/$rel_dir"
	mkdir -p "$dir"
	echo "🔹 $rel_dir"
done

echo

echo -e "🌀 Ensuring host files\n"

ensure_file() {
	file="$HOME/$1"
	content="$2"
	echo "🔹 $file"
	mkdir -p "$(dirname "$file")"
	[ -f "$file" ] || echo "$content" >"$file"
}

ensure_file ".cargo/credentials.toml"
ensure_file ".codex/auth.json" "{}"
ensure_file ".npmrc"
ensure_file ".config/mothership/.env"

echo

echo -e "🟢 Host bootstrapped!"
