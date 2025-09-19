#!/usr/bin/env bash

set -e

echo -e "⚡️ Building @mindrig/parser-wasm\n"

find ./pkg -type f ! -name 'package.json' -delete
wasm-pack build --target nodejs --out-name parser
echo -e "$(cat ./pkg/package.json | jaq '
  .dependencies //= {} |
  .dependencies["@mindrig/types"] = "workspace:*" |
  .name = "@mindrig/parser-wasm"
')" > pkg/package.json
