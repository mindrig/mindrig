#!/usr/bin/env bash

# This script sets up a VS Code. It writes a workspace file and applies
# settings.

source "$(dirname "$0")/_env.sh"

echo -e "⚡️ Setting up VS Code\n"

ensure_code_workspace force

echo -e "💚 VS Code is set up!"