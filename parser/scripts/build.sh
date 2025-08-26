#!/usr/bin/env bash

set -e

echo -e "⚡️ Building @mindcontrol/code-parser\n"

find ./pkg -type f ! -name 'package.json' -delete
wasm-pack build --target nodejs --out-name parser
sed -i 's/mindcontrol_code_parser/@mindcontrol\/code-parser/g' pkg/package.json