#!/usr/bin/env bash

set -e

eval $(dbus-launch --sh-syntax)
export DBUS_SESSION_BUS_ADDRESS

xvfb-run -a pnpm exec vscode-test
