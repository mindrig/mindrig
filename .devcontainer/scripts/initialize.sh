#!/usr/bin/env bash

set -e

# This script is run on THE HOST when the source code is located.
echo -e "⚡️ Bootstrapping host directories and files...\n"

devcontainer_id=$1
if [ -z "$devcontainer_id" ]; then
	echo "🔴 No devcontainer ID provided. Usage: ./initialize.sh <devcontainer-id>" >&2
	exit 1
fi

echo "🌀 Ensuring age key"

age_key_path="$HOME/.config/fnox/age.txt"

if [ ! -f "$age_key_path" ]; then
	echo -e "🔴 age key is missing, make sure to generate it:\n\n    age-keygen -o $age_key_path\n"
	exit 1
fi

public_key=$(grep -Po '(?<=public key:\s*)age[0-9a-z]+' "$age_key_path")

if ! grep -Fq "$public_key" fnox.toml; then
	echo -e "🔴 Public age key is missing in fnox.toml recipients, make sure to add it and re-encrypt existing keys:\n\n    ./scripts/secrets-rotate.sh\n"
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

echo -e "🌀 Ensuring host directories"

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

echo -e "🌀 Ensuring host files"

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
