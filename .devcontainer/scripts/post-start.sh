#!/usr/bin/env bash

# This script is run after the container has started.

set -e

# Start dbus for xvfb
sudo service dbus start