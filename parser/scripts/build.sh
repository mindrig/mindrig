#!/usr/bin/env bash

set -e

echo -e "⚡️ Building @mindcontrol/code-parser-wasm\n"

find ./pkg -type f ! -name 'package.json' -delete
wasm-pack build --target nodejs --out-name parser
echo -e "$(cat ./pkg/package.json | jaq '
  .dependencies //= {} |
  .dependencies["@mindcontrol/code-types"] = "workspace:*" |
  .name = "@mindcontrol/code-parser-wasm"
')" > pkg/package.json