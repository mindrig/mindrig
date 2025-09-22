#!/usr/bin/env bash

set -eo pipefail

echo -e "⚡️ Building @mindrig/parser-wasm\n"

#region package.json

# NOTE: wasm-pack removes package.json, so we back it up and restore it after
# build even if the script is killed, i.e. when other setup scripts fail
# during `turbo setup`.

package_json="./pkg/package.json"
tmp_dir="./tmp"
package_json_bak="$tmp_dir/package.json.bak"

mkdir -p "$tmp_dir"
rm -f "$package_json_bak"
cp "$package_json" "$package_json_bak"

ensure_package_json() {
  # If pkg/package.json is missing (i.e. when wasm-pack was interrepted),
  # restore the backup.
  if [ ! -f "$package_json" ]; then
    mv "$package_json_bak" "$package_json"
  else
    rm -f "$package_json_bak"
  fi

  echo -e "$(cat "$package_json" | jaq '
    .dependencies //= {} |
    .dependencies["@mindrig/types"] = "workspace:*" |
    .name = "@mindrig/parser-wasm"
  ')" > "$package_json"
}

# Ensure package.json is restored on exit
trap ensure_package_json EXIT

# Clean up all files except package.json so we don't accidentally publish
# stale files.
find ./pkg -type f ! -name 'package.json' -delete

wasm-pack build --target nodejs --out-name parser

ensure_package_json