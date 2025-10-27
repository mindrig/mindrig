#!/usr/bin/env bash

set -eo pipefail

echo -e "⚡️ Applying logo\n"

script_path="$0"
root_dir="$(dirname "$0")/.."

src_dir="public"
dest_dirs=(
  "../home/public"
)

echo "🌀 Copying public files"

for dest_dir in "${dest_dirs[@]}"; do
  echo "🔵 Copying to $dest_dir"

  mkdir -p "$dest_dir"

  for file in "$src_dir"/*; do
    [ -f "$file" ] || continue
    src_path="./$file"
    dest_path="$dest_dir/$(basename "$file")"
    rm -f "$dest_path"
    cp "$src_path" "$dest_path"
  done
done

echo -e "\n💚 Logo applied!"