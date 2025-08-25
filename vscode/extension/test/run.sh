#!/usr/bin/env bash

set -e

echo -e "⚡️ Running VS Code tests\n"

eval $(dbus-launch --sh-syntax)
export DBUS_SESSION_BUS_ADDRESS

xvfb-run -a pnpm exec vscode-test