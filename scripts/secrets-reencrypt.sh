#!/usr/bin/env bash

# This script re-encrypts all secrets using fnox.

source "$(dirname "$0")/_env.sh"

echo -e "⚡️ Re-encrypting secrets...\n"

if [ -z "$FNOX_AGE_KEY" ]; then
  echo "🔴 FNOX_AGE_KEY is not set. Please make sure mise is activated and the key is present. See ./README.md for more information."
  exit 1
fi

keys=$(toml2json fnox.toml | jaq -r '.secrets | keys[]')

echo "🔵 Found the following secrets, make sure to prepare the values:"
for key in $keys; do
  echo "🔷 $key"
done

for key in $keys; do
  echo -e "\n❔️️ Re-encrypting $key\n"
  fnox set $key
done

echo -e "\n💚 All secrets re-encrypted!"