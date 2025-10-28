#!/usr/bin/env bash

set -eo pipefail

# Wrangler's CLOUDFLARE_INCLUDE_PROCESS_ENV is not granular and will leak all
# env vars, so we manually pass only the needed ones.
fnox exec -- bash -lc '
  env -i \
    PATH="$PATH" \
    HOME="$HOME" \
    TERM="$TERM" \
    SHELL="$SHELL" \
    CLOUDFLARE_INCLUDE_PROCESS_ENV=true \
    VERCEL_GATEWAY_KEY="$VERCEL_GATEWAY_KEY" \
    wrangler dev --ip=0.0.0.0 --port 3110
'